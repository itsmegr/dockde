import express, {Application, Request, Response, NextFunction} from "express";
import {Client} from "pg"
import redis from "redis";
import cors from "cors"
const app : Application  = express()

const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST, //here i can alsoo put the ip address of pg container
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT as any as number,
})

//-----redis code goes from here
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT as any as number,
});
redisClient.on("connect", () => {
    console.log("Connected To Redis");
});

function inMemSet(key: string, value: string, expiryTime: number) {
    return new Promise((resolve, reject) => {
      redisClient.SET(key, value, "EX", expiryTime, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }
  
function inMemGet(key: string) {
    return new Promise((resolve, reject) => {
      redisClient.GET(key, (err, reply) => {
        if (err) return reject(err);
        return resolve(reply);
      });
    });
  }
  
function inMemDel(key: string) {
    return new Promise((resolve, reject) => {
      redisClient.DEL(key, (err, reply) => {
        if (err) return reject(err);
        return resolve(reply);
      });
    });
  }
//-----redis code ends here


//------all routes
type RouteHandler = (req : Request, res : Response, next : NextFunction)=> void;

app.enable("trust proxy");

app.use(cors());
app.use(express.json());
app.get("/api/", (req : Request, res : Response, next : NextFunction)=>{
    res.send("<h3> this is me Welcome to the new world!!,, this is govind</h3>");
})

app.get("/api/getAll", async (req : Request, res : Response, next : NextFunction)=>{
    try {
        const allStds = await client.query(`SELECT * FROM std`)
        var jobs = [];
        redisClient.keys('*', function (err, keys) {
            console.log("respoose done");
            res.json({
                msg :"here goes all the data!!!! change removed",
                stdRes : allStds.rows,
                redisData :  keys
            });
        })
    } catch (err) {
        next(err);
    }
})

app.get("/api/get", async(req : Request, res : Response, next : NextFunction)=>{
    try {
        const stdId = req.query.id;
        const stdRes = await client.query(`SELECT * FROM std WHERE rn = ${stdId}`)
        console.log("hey you came");
        
        res.json({
            stdRes : stdRes.rows,
        });

    } catch (err) {
        next(err);
    }
})
app.post("/api/post", async(req : Request, res : Response, next : NextFunction)=>{
    try {
        const stdName = req.body.stdName;
        const postRes = await client.query(`INSERT INTO std (stdName) VALUES ('${stdName}') RETURNING *`);
        const redisReply = await inMemSet(makeid(10), stdName,100000)
        res.json({
            msg : "student created successfully",
            postRes : postRes.rows,
            redisReply : redisReply
        })

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
//--------all routes end here


//connecting  to db
async function connectToDB(){
    while(true){
        try {
            await client.connect()
            console.log("Connected to db");
            break;
        } catch (err) {
            console.log("Failed Connecting To DB, retrying");
            console.log(err);
            await new Promise((res) => setTimeout(res, 5000));
        }
    }
}
async function migrateDB(){
    try {
        const res = await client.query(`CREATE TABLE IF NOT EXISTS std (
            rn SERIAL PRIMARY KEY,
            stdName TEXT
        )`)
        console.log("DB migrated");
    } catch (err) {
        console.log("DB migration failed");
        console.log(err);
    }
}
//here making sure that server starts only after all dependencies has been started 
connectToDB().then(async res =>{
    await migrateDB()
    app.listen(process.env.PORT, ()=>{
        console.log(`server statred ${process.env.PORT} port`);
    })
})

.catch(err=>{
    console.log(err);
    console.log("hello this is not for you");
    
})





//use ful functions
function makeid(length : number) : string {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}
