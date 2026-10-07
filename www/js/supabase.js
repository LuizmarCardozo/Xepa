export function createSupabaseStorage(firebaseAuth) {
  const config = window.XEPA_SUPABASE_CONFIG || {};
  const { url, anonKey, bucket = "produtos" } = config;
  if (!url || !anonKey) return null;

  const clientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(
    ({ createClient }) =>
      createClient(url, anonKey, {
        accessToken: async () =>
          firebaseAuth.currentUser
            ? firebaseAuth.currentUser.getIdToken()
            : null,
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }),
  );

  return {
    uploadOfferImage: async (dataUrl, userId, offerId) => {
      const client = await clientPromise;
      const response = await fetch(dataUrl);
      const image = await response.blob();
      const extension =
        { "image/png": "png", "image/webp": "webp" }[image.type] || "jpg";
      const uniqueId =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${userId}/offers/${offerId}/${uniqueId}.${extension}`;
      const { error } = await client.storage
        .from(bucket)
        .upload(path, image, { contentType: image.type, upsert: false });

      if (error) throw error;

      return {
        image: client.storage.from(bucket).getPublicUrl(path).data.publicUrl,
        imagePath: path,
      };
    },

    deleteOfferImage: async (path) => {
      if (!path) return;
      const client = await clientPromise;
      const { error } = await client.storage.from(bucket).remove([path]);
      if (error) throw error;
    },
  };
}
