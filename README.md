# Chemistry Lab Simulator

An interactive virtual chemistry laboratory for educational purposes. This web application allows students to perform virtual chemistry experiments safely and effectively.

## 🧪 Features

- **Virtual Experiments**: Aspirin Synthesis, Acid-Base Titration, Chemical Equilibrium
- **Interactive Lab Equipment**: Realistic simulation of lab tools and apparatus
- **Safety Guidelines**: Built-in safety instructions and protocols
- **Progress Tracking**: Monitor student progress and completion
- **Educational Content**: Step-by-step experiment guides

## 🚀 Live Demo

Visit the live application: [Chemistry Lab Simulator](https://Piyush.github.io/chem-lab-simulator)

## 🛠️ Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI Components
- **Animations**: Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: Drizzle ORM with Neon
- **Charts**: Recharts

## 📦 Development Setup

1. Clone the repository:

```bash
git clone https://github.com/username/chem-lab-simulator.git
cd chem-lab-simulator
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:

```bash
npm run dev
```

The development application will be available at `http://localhost:5000`

## 📁 Project Structure

```
chem-lab-simulator/
├── client/                 ← React frontend source code
├── server/                 ← Express backend source code
├── shared/                 ← Shared utilities and types
├── docs/                   ← GitHub Pages deployment files
│   ├── index.html          ← Built static site
│   └── assets/             ← Compiled CSS and JS
├── dist/                   ← Build output directory
├── package.json            ← Project configuration
└── README.md               ← This file
```

## 🏗️ Build for Production

To build the client for production:

```bash
npm run build:client
```

To build the full application (client + server):

```bash
npm run build
```

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build full application
- `npm run build:client` - Build client only
- `npm run preview` - Preview production build
- `npm run start` - Start production server
- `npm run check` - Run TypeScript check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Educational institutions for feedback and requirements
- Open source community for the amazing tools and libraries
