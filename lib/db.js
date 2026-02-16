let MongoClient;

if (typeof window === "undefined") {
	import("mongodb").then((module) => {
		MongoClient = module.MongoClient;
	});
}

const MONGODB_URI = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_URL}?retryWrites=true&w=majority`;

class DatabaseConnection {
	constructor() {
		this.client = null;
		this.db = null;
	}

	async connect() {
		if (this.db) return this.db;

		if (!this.client) {
			if (!MongoClient) {
				throw new Error("MongoDB client is not available on the client-side");
			}
			this.client = new MongoClient(MONGODB_URI, {});
			await this.client.connect();
		}

		this.db = this.client.db("exchange");
		return this.db;
	}

	async getCollection(name) {
		const db = await this.connect();
		return db.collection(name);
	}

	async close() {
		if (this.client) {
			await this.client.close();
			this.client = null;
			this.db = null;
		}
	}
}

// Create a singleton instance
const dbConnection = new DatabaseConnection();

export default dbConnection;
