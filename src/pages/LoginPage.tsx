// Placeholder login (Tahap 0). Implementasi auth manual + SSO Keycloak menyusul.
export default function LoginPage() {
  return (
    <section>
      <h1>Login</h1>
      <p className="muted">
        Halaman ini masih placeholder. Autentikasi (login manual username+password
        &amp; peran) dikerjakan pada Tahap 0; SSO Keycloak menyusul di Tahap 8.
      </p>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <label>
          Username
          <input type="text" placeholder="username" disabled />
        </label>
        <label>
          Password
          <input type="password" placeholder="password" disabled />
        </label>
        <button type="submit" disabled>
          Masuk (belum aktif)
        </button>
      </form>
    </section>
  );
}
