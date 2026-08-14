async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/doctors/search');
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.log("Error:", err.message);
  }
}
test();
