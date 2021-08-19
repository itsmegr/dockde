import express, {Application, Request, Response, NextFunction} from "express";

const app : Application  = express();

type RouteHandler = (req : Request, res : Response, next : NextFunction)=> void;


app.get("/", (req : Request, res : Response, next : NextFunction)=>{
    res.send("<h3> this is me Welcome to the new world!!,, this is govind</h3>");
})

app.listen(process.env.PORT, () : void=>{
    console.log("Server started at", process.env.PORT);
})