import mongoose from 'mongoose'

const DB_NAME = 'chat-app'

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI?.trim()
    if (!uri) {
        throw new Error('MONGODB_URI is missing. Set it in server/.env')
    }

    // Fail fast on queries when disconnected instead of buffering ~10s then timing out
    mongoose.set('bufferCommands', false)

    mongoose.connection.on('error', (err) =>
        console.error('MongoDB connection error:', err.message)
    )
    mongoose.connection.on('disconnected', () =>
        console.warn('MongoDB disconnected')
    )

    try {
        await mongoose.connect(uri, {
            dbName: DB_NAME,
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            // Helps some Windows / DNS setups that stall on IPv6 to Atlas
            family: 4,
        })
        console.log(`MongoDB connected (database: ${DB_NAME})`)
    } catch (error) {
        console.error('MongoDB connection failed:', error.message)
        throw error
    }
}