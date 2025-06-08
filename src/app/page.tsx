import MultiplicationPractice from '../components/MultiplicationPractice';

export default function Home() {
  return (
    <main className="main-content">
      <div className="container">
        <section className="home__section">
          <h1>TresMenosDos</h1>
          <p>Práctica de tablas de multiplicar con sistema adaptativo</p>
          <MultiplicationPractice />
        </section>
      </div>
    </main>
  );
} 