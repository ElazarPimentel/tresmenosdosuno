import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="main-content">
      <div className="container">
        <section className="text-center">
          <h1>404 - Página no encontrada</h1>
          <p>Lo sentimos, la página que buscas no existe.</p>
          <Link href="/" className="button">
            Volver al inicio
          </Link>
        </section>
      </div>
    </main>
  );
} 