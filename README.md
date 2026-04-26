# DroneChain 🚁
### Blockchain Drone ID System with Remote ID Compliance

[![Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square)](https://solana.com)
[![DGCA](https://img.shields.io/badge/DGCA-2021%20Compliant-green?style=flat-square)](https://digitalsky.dgca.gov.in)
[![FAA](https://img.shields.io/badge/FAA-Part%2089%20Ready-blue?style=flat-square)](https://faa.gov)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)]()

> "Every drone. Every flight. On-chain. Forever."

🌐 Live: https://dronechain-app.netlify.app
🐙 GitHub: https://github.com/B2prakash/dronechain

---

## The Problem

Current drone registration systems are:
- Centralized and prone to tampering
- Missing real-time Remote ID compliance
- Not globally verifiable by authorities
- Disconnected from blockchain technology

India alone has 300,000+ drones with DGCA
mandating registration under Drone Rules 2021.
The USA FAA Part 89 requires Remote ID
broadcasting for all drones above 250g.

---

## The Solution

DroneChain puts drone identity permanently
on Solana blockchain with full Remote ID
compliance. Every drone gets an NFT,
every flight gets logged immutably,
and authorities can verify in real-time.

---

## Remote ID Compliance

Every drone broadcasts in real-time:
- Unique drone ID and serial number
- Pilot ID and license number
- GPS coordinates and altitude AGL and MSL
- Speed and heading direction
- Ground control station location
- Emergency status and battery level
- Timestamp for every broadcast

Compliant with:
- FAA Part 89 (USA)
- DGCA Drone Rules 2021 (India)
- EASA U-space (EU)
- CAA (UK)

---

## Features

Registration System:
- Multi-step drone registration form
- NFT minting on Solana blockchain
- Document upload simulation
- QR code generation for verification
- Unique DRN ID for every drone

Remote ID Monitor:
- Live drone tracking dashboard
- Real-time broadcast simulation
- Color coded status indicators
- Violation detection and alerts

Broadcast Simulator:
- Shows exact Remote ID data broadcast
- Updates every second in real-time
- ASTM F3411-22a standard format
- Store broadcasts on Solana mock

Authority Portal:
- DGCA command center dashboard
- Investigate any drone instantly
- No-fly zone management
- Violation enforcement tools
- Report generation

User Authentication:
- Three roles: Owner, Pilot, Authority
- Document verification flow
- Role-based dashboards
- Secure login system

---

## Pages (15 Total)

1. Landing — Hero + compliance info + stats
2. Login — Role-based authentication
3. Signup — 3 role types with verification
4. Verification — Document upload flow
5. Dashboard — Role-based overview
6. Remote ID Monitor — Live drone map
7. Drone Registration — NFT minting flow
8. Broadcast Simulator — Live data feed
9. Drone Explorer — Search all drones
10. Drone Detail — Full profile with 6 tabs
11. Flight Logger — On-chain flight logging
12. Authority Portal — Command center
13. Violation System — Fines and appeals
14. Ownership Transfer — Smart contract
15. QR Scanner — Public verification
16. Analytics — Global statistics

---

## Demo Accounts

Drone Owner:
Email: ved@dronechain.io
Password: password123

DGCA Authority:
Email: authority@dgca.gov.in
Password: password123

Certified Pilot:
Email: rahul@pilot.in
Password: password123

---

## Tech Stack

Frontend:
- React 18 + Vite 5 + TypeScript
- Tailwind CSS 3
- Motion library for animations
- React Leaflet + OpenStreetMap

Charts and Visualization:
- Recharts for analytics
- Three.js concepts

Blockchain:
- Solana Web3.js
- Mock NFT minting on devnet
- Wallet adapter integration

AI Analysis:
- OpenAI GPT-3.5 Turbo
- Compliance analysis
- Violation explanations

Deployment:
- Netlify (frontend)
- GitHub (source control)

---

## Quick Start

Clone the repo:
git clone https://github.com/B2prakash/dronechain.git
cd dronechain

Install dependencies:
npm install --legacy-peer-deps

Create .env file:
VITE_OPENAI_API_KEY=your_openai_key
VITE_SOLANA_NETWORK=devnet

Run development server:
npm run dev

Build for production:
npm run build

---

## Project Structure

src/
├── pages/
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Verification.tsx
│   ├── Dashboard.tsx
│   ├── RemoteIDMonitor.tsx
│   ├── DroneRegistration.tsx
│   ├── BroadcastSimulator.tsx
│   ├── DroneExplorer.tsx
│   ├── DroneDetail.tsx
│   ├── FlightLogger.tsx
│   ├── AuthorityPortal.tsx
│   ├── ViolationSystem.tsx
│   ├── OwnershipTransfer.tsx
│   ├── QRScanner.tsx
│   └── Analytics.tsx
├── components/
│   └── ui/
├── data/
│   └── mockDrones.ts
├── services/
│   └── aiService.ts
└── lib/
    └── utils.ts

---

## Real World Impact

300,000+ drones in India need registration
DGCA mandates Remote ID compliance now
Aviation authorities need real-time tracking
Blockchain makes records tamper-proof
Smart contracts enable trustless transfers
NFT ownership proves authenticity globally

---

## Risk Algorithm

Compliance scoring for each drone:
- Remote ID inactive: minus 30 points
- Insurance expired: minus 25 points
- Too few flights logged: minus 20 points
- High violation count: minus 15 points
- New wallet detected: minus 10 points

Trust score ranges:
- 90 to 100: Highly Compliant
- 70 to 89: Compliant
- 50 to 69: Needs Attention
- Below 50: Non Compliant

---

## Hackathon

Built for 100xDevs Track
Solana Frontier Hackathon 2026
Deadline: May 11, 2026

---

## Builder

Vedprakash
BE-IT Student, Chandigarh University
GitHub: https://github.com/B2prakash
Building on Solana since 2026

---

## License

MIT License

---

Built on Solana. Compliant with DGCA and FAA. 🚁
