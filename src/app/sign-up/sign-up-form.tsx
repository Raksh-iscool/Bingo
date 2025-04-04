'use client'
import React, { useState } from 'react';
import { authClient as client } from "@/lib/auth-client";

import { useRouter } from "next/navigation";

const SignUpForm: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await client.signUp.email(
                {
                    email: formData.email,
                    password: formData.password,
                    name: formData.username, // Include username in the request
                    callbackURL: "/dashboard",
                    fetchOptions: {
                        onSuccess: () => router.push("/dashboard"),
                    }
                },

            );
        } catch (err) {
            console.error("Error during sign-up:", err);
            setError("An error occurred during sign-up. Please try again.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="sign-up-form">
            {error && <p className="error-message">{error}</p>}
            <div>
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                />
            </div>
            <button type="submit">Sign Up</button>
        </form>
    );
};

export default SignUpForm;