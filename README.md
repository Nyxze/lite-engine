# Lite Engine

A lightweight, modular 3D web engine built with TypeScript, focusing on efficient scene management and component-based architecture.

## Overview

Lite Engine is a minimalist 3D engine implementation that provides essential tools for creating and managing 3D scenes in web applications. Built with TypeScript and modern web technologies, it offers a clean, efficient foundation for developing interactive 3D experiences.

## 🚀 Features

- Lightweight and modular architecture
- Component-based scene management
- Asset management system
- Lifecycle event handling
- TypeScript support for type safety
- Hot module reloading during development
- Optimized build process

## 🛠 Technology Stack

- **Language**: TypeScript v5.8.3
- **Build Tool**: Vite v6.3.5
- **3D Graphics**: Three.js v0.177.0
- **Module System**: ES Modules

## 📁 Project Structure

```
lite-engine/
├── src/
│   ├── core/                 # Core engine components
│   │   ├── context.ts       # Engine context and state management
│   │   ├── component.ts     # Base component system
│   │   ├── scene_router.ts  # Scene management and routing
│   │   ├── assets_db.ts     # Asset management system
│   │   └── life_cycle_event.ts # Component lifecycle management
│   ├── components/          # Reusable components
│   ├── example/            # Example implementations
│   └── home.ts             # Entry point
├── public/                 # Static assets
└── index.html             # Main HTML entry point
```

## 🏗 Architecture

The engine is built around several core concepts:

1. **Context System** (`context.ts`)
   - Central state management
   - Resource handling
   - Scene context management

2. **Component System** (`component.ts`)
   - Base component architecture
   - Reusable component patterns
   - Component lifecycle management

3. **Scene Router** (`scene_router.ts`)
   - Scene management and transitions
   - Route-based scene loading
   - Scene state handling

4. **Asset Management** (`assets_db.ts`)
   - Asset loading and caching
   - Resource management
   - Asset optimization

5. **Lifecycle Events** (`life_cycle_event.ts`)
   - Component lifecycle hooks
   - Event management system
   - State synchronization

## 🚦 Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

### Production Build

Create a production build:
```bash
npm run build
```

## 📦 Dependencies

### Core Dependencies
- `three`: ^0.177.0
- `@types/three`: ^0.177.0

### Development Dependencies
- `typescript`: ~5.8.3
- `vite`: ^6.3.5

## 🔧 Configuration

### TypeScript

The project uses TypeScript for type safety and better development experience. Configuration can be found in `tsconfig.json`.

### Vite

Development and build processes are handled by Vite, providing:
- Fast hot module replacement
- Optimized production builds
- ES module support

## 📄 License

This project is private and not intended for public distribution.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 