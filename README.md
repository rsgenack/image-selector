# Image Sorter

A simple React application to sort through SVG images, allowing you to like or dislike each image using keyboard arrow keys. Liked images will be saved to a downloadable JSON file with their full paths.

## Features

- View SVG images one by one in a full-screen interface
- Use left arrow key (←) to dislike and right arrow key (→) to like images
- Track progress through all images
- Download a JSON file with paths to all liked images when finished
- Responsive design works on desktop and mobile

## Setup Instructions

1. Make sure you have Node.js installed on your system (version 14+ recommended)
2. Clone this repository
3. Place all your SVG images in the parent directory (no spaces in filenames)
4. Navigate to the project directory and install dependencies:

```bash
cd image-sorter
npm install
```

5. Start the image sorter application:

```bash
npm run sort-images
```

This will automatically open your browser to http://localhost:3000

## Other Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build-prod

# Preview production build
npm run serve
```

## Usage

- Press the right arrow key (→) to like an image (or click the "Like" button)
- Press the left arrow key (←) to dislike an image (or click the "Dislike" button)
- When you've gone through all images, you'll see a "Download JSON File" button
- Click this button to download a JSON file containing paths to all images you liked

## Dependencies

- React
- React Router
- TypeScript
- Vite

## Notes

- The application accesses SVG files from the parent directory
- Ensure there are no spaces in your image filenames for best compatibility
- The downloaded JSON file will contain absolute paths to the liked images
