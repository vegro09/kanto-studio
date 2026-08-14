# Kanto Studio

Act as a Principal Frontend UI/UX Designer. Create a modern, minimalist web application interface using React, Tailwind CSS, and Lucide Icons.

CRITICAL DESIGN SYSTEM:

- Strict Monochrome / Black & White aesthetic ONLY.

- Background: Pure Black (#000000).

- Text & Accents: Pure White (#FFFFFF) and functional dark grays (#1A1A1A, #333333).

- Borders: 1px solid #333333 with clean, sharp edges. No soft shadows, no color gradients.

Please create a clean React Router setup with 3 main screens:

1. THE DASHBOARD (`/dashboard`):

   - Top Bar: App title "Kanto Motion" (White text, bold), "Account" button on the right.

   - Main Grid:

     - Card 1: "Start New Project" (+ icon, prominent white border). Clicking it redirects to `/studio/new`.

     - Project Cards Grid: Render 3 example project cards showing project title, creation date, and an options menu. Clicking a card navigates to `/studio/{id}`.

2. THE ACCOUNT PAGE (`/account`):

   - Top Bar: "Back to Dashboard" button.

   - User Profile Header: Display name "Kanto" and account tier status.

   - Pricing Tiers Grid: 3 cards (Free, Creator, Pro).

     - Free & Creator: Black background, white border, white text.

     - Pro Tier (Highlighted): Inverted style (Solid White background, Black text).

3. THE STUDIO PLACEHOLDER PAGE (`/studio/:id`):

   - Top Bar: Minimalist header overlay containing ONLY a "<- Back to Dashboard" button and project title input.

   - Main Content Area: A completely empty, clean black container div with `id="studio-engine-placeholder"`.

   - Add a clear code comment: `/* ANTIGRAVITY ENGINE MOUNT POINT - DO NOT ALTER UI STRUCTURE */`.

Output clean, modular React components using React Router v6.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/651a4318-7d4b-4c3d-8394-078532da08b6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
