/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    images: {
        domains: ['example.com', 'static.toiimg.com', 'res.cloudinary.com', 'img.icons8.com'],
    },
};

export default config;
