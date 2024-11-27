import express from "express";
import pg from "pg";
import axios from "axios";
import { reverse } from "dns";


const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database:"books",
    password: "james7788",
    port: 5432
});


app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


db.connect();

let reviews = [];
const ExistingReviews = await db.query("Select * FROM books");
//console.log(ExistingReviews.rows);
await ExistingReviews.rows.forEach(review => { 
    reviews.push({id: review.id, title: review.title, author: review.author, review: review.review, rating: review.rating, cover_url: review.cover_url});
});



async function getBookCovers(id) {
    try{
        const response = await axios.get(`https://covers.openlibrary.org/b/iD/${id}-M.jpg`);
        //const cover = response.config.url; // Get the URL from the response
        const cover = `https://covers.openlibrary.org/b/iD/${id}-s.jpg`;
        return cover; 

    }catch(error){
        console.error("Error fetching the book cover:", error.stack);
        res.status(500).send("Error fetching the book cover");
    }
}

//Given a title, returns the author and cover id that can be used to find the coverURL
async function getBookInformation(title){
    
    try{
        const bookInfo = await axios.get(`https://openlibrary.org/search.json?title=${title}`);
        //console.log(bookInfo);
        //console.log(bookInfo.data.docs[0].author_name);
        //console.log(bookInfo.data.docs[0].cover_i);
        const author = bookInfo.data.docs[0].author_name;
        const id = bookInfo.data.docs[0].cover_i;
        return {
            author: author,
            cover_id: id,
        };
        
;    }catch(error){
        console.error("error fetching the book imformation, the title must be wrong:", error.stack);
        

    }

}

//home page
app.get("/", async (req,res) =>{

   

    res.render("index.ejs", {reviews: reviews});


});
//inserts new review into database, retreives the cover image if it is acurate
app.post("/new", async (req,res) => {

    const title = req.body.title;
    const review = req.body.review;
    const author = req.body.author;
    const rating = req.body.rating;
    const book = await getBookInformation(title);
    const cover_url = `https://covers.openlibrary.org/b/iD/${book.cover_id}-M.jpg`
    const newReview = await db.query("INSERT INTO books (title, author, review, rating, cover_url) values($1,$2,$3,$4,$5) RETURNING *",[title,author,review,rating,cover_url]);
    console.log(newReview.rows[0].id);
    reviews.push({id: newReview.rows[0].id, title: title, review: review, author: author, rating: rating, cover_url: cover_url});
    res.redirect("/");
});
app.get("/new", (req,res) =>{
    //console.log(req.query.id);
    res.render("edit.ejs");

});
// route when making a new post to attempt to autofill
app.get("/info", async (req,res) =>{

    const title = req.query.title;
    const book = await getBookInformation(title);
    //console.log(book);
    res.render("edit.ejs", {book: book, title:title});
    


});

app.get("/edit/:id", async (req,res)=>{
    const review = await db.query("Select * fROM books WHERE id = $1", [req.params.id]);
   // console.log(review.rows[0]);
   // console.log(req.params.id);
    res.render("edit.ejs", {review:review.rows[0], id: req.params.id});
});
app.post("/edit/:id", async (req,res)=>{
    const title = req.body.title;
    const review = req.body.review;
    const author = req.body.author;
    const rating = req.body.rating;
    //console.log(title+review+author+rating);
    console.log(req.params.id);
    db.query("UPDATE books SET title = $1, review = $2, author = $3, rating =$4 WHERE id = $5",[title,review,author,rating,req.params.id]);
    const index = await reviews.findIndex(review => review.id == req.params.id );
    const cover_url = reviews[index].cover_url;
    reviews[index] = {title: title,review: review,author: author,rating: rating, id: req.params.id, cover_url: cover_url};
    
    res.redirect("/");

});
app.get("/delete/:id", async(req,res)=>{
    console.log(req.params.id);
    db.query("DELETE FROM books where id = $1", [req.params.id]);
    const index = await reviews.findIndex(review => review.id == req.params.id ); reviews.find
    reviews.splice(index,1);
    res.redirect("/");

});
app.listen(port, ()=>{

console.log("listening on port: " + port);

});

