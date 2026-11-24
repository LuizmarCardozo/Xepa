// Upload de imagens no Supabase Storage usando a API REST diretamente.
// Não depende mais de biblioteca externa (antes: import dinâmico de esm.sh,
// que falhava com "Failed to fetch dynamically imported module").
export function createSupabaseStorage(firebaseAuth) {
  const config = window.XEPA_SUPABASE_CONFIG || {};
  const { url, anonKey, bucket = "produtos" } = config;
  if (!url || !anonKey) return null;

  const base = String(url).replace(/\/+$/, "");
  const encodePath = (path) =>
    path.split("/").map(encodeURIComponent).join("/");

  async function authHeaders() {
    let token = null;
    try {
      token = firebaseAuth?.currentUser
        ? await firebaseAuth.currentUser.getIdToken()
        : null;
    } catch (_) {}
    return { apikey: anonKey, Authorization: `Bearer ${token || anonKey}` };
  }

  function publicUrl(path) {
    return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodePath(path)}`;
  }

  async function upload(dataUrl, path) {
    const response = await fetch(dataUrl);
    const image = await response.blob();
    const res = await fetch(
      `${base}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`,
      {
        method: "POST",
        headers: {
          ...(await authHeaders()),
          "Content-Type": image.type || "image/jpeg",
          "x-upsert": "false",
          "cache-control": "max-age=3600",
        },
        body: image,
      },
    );
    if (!res.ok) {
      let message = `Falha ao enviar imagem (${res.status})`;
      try {
        const data = await res.json();
        message = data.message || data.error || message;
      } catch (_) {}
      throw new Error(message);
    }
    return { image: publicUrl(path), imagePath: path };
  }

  async function remove(path) {
    if (!path) return;
    const res = await fetch(
      `${base}/storage/v1/object/${encodeURIComponent(bucket)}`,
      {
        method: "DELETE",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: [path] }),
      },
    );
    if (!res.ok) throw new Error(`Falha ao remover imagem (${res.status})`);
  }

  const extensionOf = async (dataUrl) => {
    const type = (await (await fetch(dataUrl)).blob()).type;
    return { "image/png": "png", "image/webp": "webp" }[type] || "jpg";
  };
  const newId = () =>
    window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    uploadProfileImage: async (dataUrl, userId) =>
      upload(
        dataUrl,
        `${userId}/profile/${newId()}.${await extensionOf(dataUrl)}`,
      ),
    uploadOfferImage: async (dataUrl, userId, offerId) =>
      upload(
        dataUrl,
        `${userId}/offers/${offerId}/${newId()}.${await extensionOf(dataUrl)}`,
      ),
    deleteOfferImage: remove,
    deleteProfileImage: remove,
  };
}
