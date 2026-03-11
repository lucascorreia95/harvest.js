# 🌾 Harvest.js  
A Full-Stack Farm Simulation Engine
Harvest.js is a modern reimagining of the classic "Social Farm" genre (popularized by titles like Happy Farm). This project serves as a technical showcase for building a real-time, persistent state application with a focus on clean architecture, time-based logic, and scalability.

## 🎯 Project Purpose  
The goal of Harvest.js is to move beyond simple CRUD applications. It demonstrates the ability to manage complex game loops, where the state of the application changes even when the user is offline (e.g., plants growing over time).

### Key Technical Challenges:
- Time-Synchronization: Calculating growth stages based on server-side timestamps to prevent client-side manipulation.

- State Management: Handling a dynamic grid of "plots" with different growth cycles.

- Monorepo Architecture: Ensuring a seamless developer experience by sharing types and logic between the frontend and backend.
