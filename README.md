# Life Maxing Dashboard

A minimalist desktop application for tracking your daily goals and habits.

## Features

- 📅 **Calendar Navigation** - Jump to any date and view/edit entries
- ✅ **Daily Checklist** - Track 6 key daily habits:
  1. Gym/weights
  2. Cardio or 10k steps
  3. Faculty studying (with hours)
  4. Business/work (with hours)
  5. Time with girls (with option to track nice gestures)
  6. Reading (with pages tracked)

- 📊 **Daily Goals Display** - See your progress towards daily targets
- 📈 **Weekly Stats** - View your weekly performance against goals:
  - Gym: 4+ days/week
  - Cardio: 3+ days/week
  - Faculty: 4+ hours/week
  - Business: 10+ hours/week
  - Girls: 3+ outings, 2+ nice things
  - Reading: 100+ pages/week

## Installation & Running

```bash
# Install dependencies (already done)
npm install

# Start the development server
npm run dev
```

The app will open automatically. React dev server runs on port 3000, and Electron window connects to it.

## Data Storage

All data is stored locally in the `data/` folder:
- `data/lifemax.db` - SQLite database with all entries

Data is never sent to the internet - it's completely local and private.

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI components
- **SQLite** - Local database
- **Minimalist CSS** - Clean, distraction-free design
