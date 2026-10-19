export default function Privacy() {
  return (
    <div className="stack">
      <h2>Privacy policy</h2>
      <p>
        Zizz Hotels respects your privacy. This page explains what personal information we collect, why,
        and what your rights are under South Africa's Protection of Personal Information Act (POPIA).
      </p>

      <h3>What we collect</h3>
      <ul>
        <li>Your name, email address and (optionally) phone number.</li>
        <li>Your bookings, saved hotels, reviews and notifications.</li>
        <li>If you sign in with GitHub, your name and verified email address from GitHub.</li>
      </ul>

      <h3>Why we collect it</h3>
      <p>
        To create your account, handle your bookings, contact you about them, and show your reviews.
        We do not sell your information and we do not use it for advertising.
      </p>

      <h3>Who else sees it</h3>
      <ul>
        <li>
          <b>Stripe</b> processes payments. Your card details go straight to Stripe and are never stored
          on our servers.
        </li>
        <li>
          <b>GitHub</b> confirms your identity if you choose to sign in with it.
        </li>
      </ul>

      <h3>Cookies and storage</h3>
      <p>
        We store a login token in your browser so you stay signed in. We do not use tracking or
        advertising cookies.
      </p>

      <h3>How long we keep it</h3>
      <p>
        Your account details are kept while your account is open. If you delete your account, your name,
        email, phone number and password are erased, and your saved hotels and notifications are deleted.
        Booking records are kept without your personal details, because we must keep records of payments.
      </p>

      <h3>Your rights</h3>
      <ul>
        <li>See your information: use "Download my data" on your Profile page.</li>
        <li>Correct your information: edit your name and phone on your Profile page.</li>
        <li>Have your information removed: use "Delete my account" on your Profile page.</li>
        <li>Complain to the Information Regulator if you believe your information was misused.</li>
      </ul>

      <h3>Contact</h3>
      <p>Questions about your information: leo@gates.com</p>
    </div>
  );
}