const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PAYU_KEY = process.env.PAYU_MERCHANT_KEY || process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_MERCHANT_SALT || process.env.PAYU_SALT;

const PAYU_URL = process.env.PAYU_PAYMENT_URL || "https://secure.payu.in/_payment";

// Generate SHA512
function sha512(value) {
    return crypto
        .createHash("sha512")
        .update(value)
        .digest("hex");
}

// ===============================
// CREATE PAYU PAYMENT
// ===============================

app.post("/api/payu/create-payment", async (req, res) => {
    try {
        // Expect only appointmentId and required customer info
        const { appointmentId, firstname, email, phone } = req.body;
        if (!appointmentId || !firstname || !email || !phone) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        // Lookup appointment and authoritative amount
        const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }
        const amount = appointment.fee?.toString();
        if (!amount) {
            return res.status(400).json({ success: false, message: "Appointment fee not set" });
        }
        const productinfo = "Appointment";
        // Generate unique transaction ID
        const { v4: uuidv4 } = require("uuid");
        const txnid = uuidv4();
        // Build hash string as per PayU docs
        const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}` + `|||||||||||${PAYU_SALT}`;
        const hash = sha512(hashString);
        // Create payment record (INITIATED)
        await prisma.payment.create({
            data: {
                txnid,
                appointmentId: appointment.id,
                amount: parseFloat(amount),
                payuRequest: {
                    key: PAYU_KEY,
                    txnid,
                    amount,
                    productinfo,
                    firstname,
                    email,
                    phone,
                    surl: `${process.env.BACKEND_URL}/api/payu/success`,
                    furl: `${process.env.BACKEND_URL}/api/payu/failure`,
                    hash,
                },
                status: "INITIATED",
                mode: "PAYU",
            },
        });
        const paymentData = {
            key: PAYU_KEY,
            txnid,
            amount,
            productinfo,
            firstname,
            email,
            phone,
            surl: `${process.env.BACKEND_URL}/api/payu/success`,
            furl: `${process.env.BACKEND_URL}/api/payu/failure`,
            hash,
        };
        res.json({ success: true, paymentUrl: PAYU_URL, paymentData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Unable to create payment" });
    }
});

    try {

        const {
            amount,
            productinfo,
            firstname,
            email,
            phone
        } = req.body;

        if (!amount || !productinfo || !firstname || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "Missing payment details"
            });
        }

        // Unique transaction ID
        const txnid = "ICH" + Date.now();

        /*
          PayU hash:

          key|txnid|amount|productinfo|firstname|email|
          udf1|udf2|udf3|udf4|udf5||||||SALT
        */

        const hashString =
            `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}` +
            `|||||||||||${PAYU_SALT}`;

        const hash = sha512(hashString);

        const paymentData = {
            key: PAYU_KEY,
            txnid,
            amount,
            productinfo,
            firstname,
            email,
            phone,

            surl: `${process.env.BACKEND_URL}/api/payu/success`,
            furl: `${process.env.BACKEND_URL}/api/payu/failure`,

            hash
        };

        res.json({
            success: true,
            paymentUrl: PAYU_URL,
            paymentData
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to create payment"
        });
    }
});


// ===============================
// PAYU SUCCESS
// ===============================

app.post("/api/payu/success", async (req, res) => {
    const response = req.body;
    // Reconstruct hash string according to PayU reverse hash spec
    const hashString = `${PAYU_SALT}|${response.status}` +
        `||||||` +
        `${response.udf5 || ""}|` +
        `${response.udf4 || ""}|` +
        `${response.udf3 || ""}|` +
        `${response.udf2 || ""}|` +
        `${response.udf1 || ""}|` +
        `${response.email || ""}|` +
        `${response.firstname || ""}|` +
        `${response.productinfo || ""}|` +
        `${response.amount || ""}|` +
        `${response.txnid || ""}|` +
        `${response.key || ""}`;
    const calculatedHash = sha512(hashString).toLowerCase();
    const receivedHash = (response.hash || "").toLowerCase();
    if (calculatedHash !== receivedHash) {
        console.error("INVALID PAYU HASH");
        return res.status(400).send("Payment verification failed");
    }
    // Find the payment record (idempotent handling)
    const payment = await prisma.payment.findUnique({ where: { txnid: response.txnid } });
    if (!payment) {
        console.error("Payment record not found for txnid", response.txnid);
        return res.status(404).send("Payment not found");
    }
    // Verify amount matches the amount we stored (authoritative)
    if (parseFloat(response.amount) !== payment.amount) {
        console.error("Amount mismatch", response.amount, payment.amount);
        return res.status(400).send("Amount mismatch");
    }
    // Update payment record (upsert semantics via update)
    await prisma.payment.update({
        where: { txnid: response.txnid },
        data: {
            status: response.status === "success" ? "SUCCESS" : "FAILED",
            mihpayid: response.mihpayid,
            payuResponse: response,
        },
    });
    // Update appointment status only on successful verification
    if (response.status === "success") {
        await prisma.appointment.update({
            where: { id: payment.appointmentId },
            data: {
                paymentStatus: "PAID",
                status: "CONFIRMED",
            },
        });
        return res.redirect(`${process.env.FRONTEND_URL}/payment-success?txnid=${response.txnid}`);
    }
    // Failure case – do not alter appointment paymentStatus
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?txnid=${response.txnid}`);
});

    const response = req.body;

    console.log("PayU response:", response);

    const hashString =
        `${PAYU_SALT}|${response.status}` +
        `||||||` +
        `${response.udf5 || ""}|` +
        `${response.udf4 || ""}|` +
        `${response.udf3 || ""}|` +
        `${response.udf2 || ""}|` +
        `${response.udf1 || ""}|` +
        `${response.email || ""}|` +
        `${response.firstname || ""}|` +
        `${response.productinfo || ""}|` +
        `${response.amount || ""}|` +
        `${response.txnid || ""}|` +
        `${response.key || ""}`;

    const calculatedHash = sha512(hashString);

    const receivedHash = (response.hash || "").toLowerCase();

    if (calculatedHash.toLowerCase() !== receivedHash) {

        console.log("INVALID PAYU HASH");

        return res.status(400).send(
            "Payment verification failed"
        );
    }

    if (response.status === "success") {

        console.log("PAYMENT VERIFIED:", response.txnid);

        // IMPORTANT:
        // Update database here.
        //
        // Example:
        // appointment.paymentStatus = "paid"
        // appointment.paymentId = response.mihpayid

        return res.redirect(
            `${process.env.FRONTEND_URL}/payment-success?txnid=${response.txnid}`
        );
    }

    return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failure`
    );
});

// ===============================
// PAYU BROWSER CHECKOUT
// ===============================
app.get("/pay", (req, res) => {
    const { amount, productinfo, firstname, email, phone } = req.query;
    if (!amount || !productinfo || !firstname || !email || !phone) {
        return res.status(400).send("Missing payment parameters");
    }
    const txnid = "ICH" + Date.now();
    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}` + `|||||||||||${PAYU_SALT}`;
    const hash = sha512(hashString);
    const formHtml = `<!DOCTYPE html>
<html><head><title>Redirecting to PayU…</title></head><body>
    <form id="payuForm" method="POST" action="${PAYU_URL}">
        <input type="hidden" name="key" value="${PAYU_KEY}" />
        <input type="hidden" name="txnid" value="${txnid}" />
        <input type="hidden" name="amount" value="${amount}" />
        <input type="hidden" name="productinfo" value="${productinfo}" />
        <input type="hidden" name="firstname" value="${firstname}" />
        <input type="hidden" name="email" value="${email}" />
        <input type="hidden" name="phone" value="${phone}" />
        <input type="hidden" name="surl" value="${process.env.BACKEND_URL}/api/payu/success" />
        <input type="hidden" name="furl" value="${process.env.BACKEND_URL}/api/payu/failure" />
        <input type="hidden" name="hash" value="${hash}" />
    </form>
    <script>document.getElementById('payuForm').submit();</script>
</body></html>`;
    res.send(formHtml);
});


// ===============================
// PAYU FAILURE
// ===============================

app.post("/api/payu/failure", (req, res) => {

    console.log("PAYU FAILURE RESPONSE:");
    console.log(req.body);

    const response = req.body;

    return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failure?txnid=${response.txnid || ""}`
    );
});


// ===============================
// SERVER
// ===============================

app.listen(3000, () => {
    console.log("ICH Meds PayU server running");
    console.log("http://localhost:3000");
});
