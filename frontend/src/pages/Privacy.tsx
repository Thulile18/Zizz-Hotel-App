export default function Privacy() {
  return (
    <div className="v-page">
      <div className="v-prose fade-up">
        <div className="v-prose-head">
          <p className="eyebrow">Legal</p>
          <h1>Privacy policy</h1>
        </div>

        <p>
          VELOUR respects your privacy. This page explains what personal information we collect, why,
          and what your rights are under South Africa's Protection of Personal Information Act (POPIA).
        </p>

        <div>
          <h3>What we collect</h3>
          <ul className="v-list">
            <li><span>Your name, email address and (optionally) phone number.</span></li>
            <li><span>Your bookings, saved hotels, reviews and notifications.</span></li>
            <li><span>If you sign in with GitHub, your name and verified email address from GitHub.</span></li>
          </ul>
        </div>

        <div>
          <h3>Why we collect it</h3>
          <p>
            To create your account, handle your bookings, contact you about them, and show your reviews.
            We do not sell your information and we do not use it for advertising.
          </p>
        </div>

        <div>
          <h3>Who else sees it</h3>
         <li>
            <b>OpenStreetMap</b> receives the place name you type into "find stays near a place", so we can
          work out distances. Your device location, if you tap "Near me", stays in your browser and is
          never sent to our servers.
        </li>
          <ul className="v-list">
            <li>
              <span>
                <b>Stripe</b> processes payments. Your card details go straight to Stripe and are never
                stored on our servers.
              </span>
            </li>
            <li>
              <span>
                <b>GitHub</b> confirms your identity if you choose to sign in with it.
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h3>Cookies and storage</h3>
          <p>
            We store a login token in your browser so you stay signed in. We do not use tracking or
            advertising cookies.
          </p>
        </div>

        <div>
          <h3>How long we keep it</h3>
          <p>
            Your account details are kept while your account is open. If you delete your account, your name,
            email, phone number and password are erased, and your saved hotels and notifications are deleted.
            Booking records are kept without your personal details, because we must keep records of payments.
          </p>
        </div>

        <div>
          <h3>Your rights</h3>
          <ul className="v-list">
            <li><span>See your information: use "Download my data" on your Profile page.</span></li>
            <li><span>Edit your name, phone, email and password</span></li>
            <li><span>Have your information removed: use "Delete my account" on your Profile page.</span></li>
            <li><span>Complain to the Information Regulator if you believe your information was misused.</span></li>
          </ul>
        </div>

        <div className="v-prose-foot">
          <h3>Contact</h3>
          <p>
            Questions about your information: <span className="v-gold">leo@gates.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}