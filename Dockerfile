# Use an official Node.js image as the base
FROM bitnami/node:20

# Install Python3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Install youtube-transcript-api Python package
RUN pip3 install youtube-transcript-api

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package.json package-lock.json ./

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install the Node.js dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "start"]