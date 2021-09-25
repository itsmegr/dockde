import express, {Application, Request, Response, NextFunction} from "express";
import {Client} from "pg"
const app : Application  = express();

const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST, //here i can alsoo put the ip address of pg container
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT as any as number,
})

type RouteHandler = (req : Request, res : Response, next : NextFunction)=> void;

app.use(express.json());
app.get("/", (req : Request, res : Response, next : NextFunction)=>{
    res.send("<h3> this is me Welcome to the new world!!,, this is govind</h3>");
})

app.get("/getAll", async (req : Request, res : Response, next : NextFunction)=>{
    try {
        const allStds = await client.query(`SELECT * FROM std`)
        res.json(allStds.rows);
    } catch (err) {
        next(err);
    }
})

app.get("/get", async(req : Request, res : Response, next : NextFunction)=>{
    try {
        const stdId = req.query.id;
        const stdRes = await client.query(`SELECT * FROM std WHERE rn = ${stdId}`)
        res.json(stdRes.rows);

    } catch (err) {
        next(err);
    }
})
app.post("/post", async(req : Request, res : Response, next : NextFunction)=>{
    try {
        const stdName = req.body.stdName;
        const postRes = await client.query(`INSERT INTO std (stdName) VALUES ('${stdName}') RETURNING *`);
        res.send(postRes.rows)

    } catch (err) {
        next(err);
    }
})

app.use((err : any, req : Request, res : Response, next : NextFunction)=>{
    console.log(err);
    res.json({
        status : err.status,
        msg : err.message
    });
})


//connecting  to db
async function connectToDB(){
    while(true){
        try {
            await client.connect()
            console.log("Connected to db");
            //migrating the db
            const res = await client.query(`CREATE TABLE IF NOT EXISTS std (
                rn SERIAL PRIMARY KEY,
                stdName TEXT
            )`)
            console.log("DB migrated");
            break;
        } catch (err) {
            console.log("Failed Connecting To DB, retrying");
            console.log(err);
            await new Promise((res) => setTimeout(res, 5000));
        }
    }
}
//here making sure that server starts only after all dependencies has been started 
connectToDB().then(res =>{
    app.listen(process.env.PORT, ()=>{
        console.log("server statred");
    })
})

.catch(err=>{
    console.log(err);
})
