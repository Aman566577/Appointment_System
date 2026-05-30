const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Email config error:', error.message);
  } else {
    console.log('Email server ready!');
  }
});

// Send booking confirmation email
const sendBookingEmail = async (studentEmail, professorEmail, slot) => {
  try {
    // Email to Professor
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: professorEmail,
      subject: '📅 New Appointment Booked!',
      html: `
        <h2>New Appointment Booked!</h2>
        <p>A student has booked an appointment with you.</p>
        <h3>Appointment Details:</h3>
        <p><b>Date:</b> ${new Date(slot.startTime).toDateString()}</p>
        <p><b>Time:</b> ${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}</p>
        <br/>
        <p>Please be available at the scheduled time.</p>
      `,
    });

    // Email to Student
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: '✅ Appointment Confirmed!',
      html: `
        <h2>Your Appointment is Confirmed!</h2>
        <p>Your appointment has been successfully booked.</p>
        <h3>Appointment Details:</h3>
        <p><b>Date:</b> ${new Date(slot.startTime).toDateString()}</p>
        <p><b>Time:</b> ${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}</p>
        <br/>
        <p>Please be on time!</p>
      `,
    });

    console.log('Booking emails sent successfully!');
  } catch (err) {
    console.error('Email sending error:', err.message);
  }
};

// Send cancellation email
const sendCancellationEmail = async (studentEmail, professorEmail, slot) => {
  try {
    // Email to Student
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: '❌ Appointment Cancelled!',
      html: `
        <h2>Your Appointment has been Cancelled!</h2>
        <p>Unfortunately your appointment has been cancelled by the professor.</p>
        <h3>Cancelled Appointment Details:</h3>
        <p><b>Date:</b> ${new Date(slot.startTime).toDateString()}</p>
        <p><b>Time:</b> ${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}</p>
        <br/>
        <p>Please book another available slot.</p>
      `,
    });

    // Email to Professor
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: professorEmail,
      subject: '❌ Appointment Cancelled!',
      html: `
        <h2>Appointment Cancelled!</h2>
        <p>You have successfully cancelled the appointment.</p>
        <h3>Cancelled Appointment Details:</h3>
        <p><b>Date:</b> ${new Date(slot.startTime).toDateString()}</p>
        <p><b>Time:</b> ${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}</p>
      `,
    });

    console.log('Cancellation emails sent successfully!');
  } catch (err) {
    console.error('Email sending error:', err.message);
  }
};

module.exports = { sendBookingEmail, sendCancellationEmail };