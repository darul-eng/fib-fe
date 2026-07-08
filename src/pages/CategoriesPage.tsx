import { useEffect, useState } from 'react';
import { apiGet, type Category } from '../api/client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Category[]>('/categories')
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Memuat kategori...</p>;
  if (error)
    return (
      <div>
        <p className="error">Gagal memuat: {error}</p>
        <p className="muted">Pastikan backend berjalan & database sudah di-seed.</p>
      </div>
    );

  return (
    <section>
      <h1>Kategori Aset</h1>
      <p className="muted">{categories.length} kategori terdaftar.</p>
      <div className="grid">
        {categories.map((c) => (
          <div className="card" key={c.id}>
            <h3>{c.nama}</h3>
            {c.fields.length === 0 ? (
              <p className="muted">Tanpa atribut khusus</p>
            ) : (
              <ul>
                {c.fields.map((f) => (
                  <li key={f.id}>
                    {f.label} <span className="tag">{f.tipe}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
