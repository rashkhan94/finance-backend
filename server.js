const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const config = require('./src/config');

// handle uncaught exceptions early
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION — shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`\n  Server running in ${config.env} mode on port ${config.port}`);
      console.log(`  API docs available at http://localhost:${config.port}/api-docs\n`);
    });

    // graceful shutdown on unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION — shutting down...');
      console.error(err.name, err.message);
      server.close(() => process.exit(1));
    });

    // handle SIGTERM for graceful shutdown (e.g. in containers)
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
