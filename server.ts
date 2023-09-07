/** @format */

//
import { app } from "./app";
require("dotenv").config();

// Files and utils imports
import connectDB from "./utils/db";

connectDB();
// Create server
app.listen(process.env.PORT, () => {
	console.log(`Server is connected on PORT: ${process.env.PORT}`);
});
