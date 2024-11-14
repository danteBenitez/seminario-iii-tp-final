export const resolveUrl = (url: string) => {
    return new URL(url, import.meta.env.VITE_API_URL);
};