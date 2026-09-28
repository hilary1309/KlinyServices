exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const data = JSON.parse(event.body);

  // Send to EmailJS
  const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  "service_1fqblev",
      template_id: "template_rlilxnb",
      user_id:     "O4WOu2Su1l8Sp_NjP",
      template_params: data,
    }),
  });

  // Send to Google Sheet
  await fetch("https://script.google.com/macros/s/AKfycbyhOeeQykCs4JmPhHto1jkPP6z6DQsQe7EHx17qAudzMyZ4zu_Tnd4kBr2qXIQhPA6g/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};