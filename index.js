const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "1234"

const express = require('express')
const app = express()
const port = 3000

const mongoose = require('mongoose')
const multer = require('multer');
const nodemailer = require('nodemailer');
const session = require('express-session')

async function main() {
    await mongoose.connect('mongodb://harshit:kAHB686pVtrBm0Ly@ac-gehdrlj-shard-00-00.5dbdfu8.mongodb.net:27017,ac-gehdrlj-shard-00-01.5dbdfu8.mongodb.net:27017,ac-gehdrlj-shard-00-02.5dbdfu8.mongodb.net:27017/?ssl=true&replicaSet=atlas-122lgo-shard-0&authSource=admin&appName=Cluster0')
}

main()
.then(()=>{console.log("DB Connected")})
.catch((err)=>{console.log(err)})

const bookschema = mongoose.Schema({
    title:String,
    author: String,
    price: Number,
    category: String,
    img: String
})

const Book = mongoose.model("Book",bookschema)

app.set('view engine','ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }

});

const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tharshit390@gmail.com',
        pass: 'unft uvof hyqz vxdv'
    }
});

app.use(session({
    secret:'bookstoresecret',
    resave:false,
    saveUninitialized:false
}))

function isAdmin(req,res,next){
        if(req.session.isAdmin){
            next()
        }else{
            res.send('Access Denied')
        }
}

app.get('/',(req,res)=>{
    res.render('home')
})

app.get('/admin/login',(req,res)=>{
    res.render('adminlogin')
})

app.post('/admin/login',(req,res)=>{
    const username = req.body.username
    const password = req.body.password

    if(username == ADMIN_USERNAME && password == ADMIN_PASSWORD){
        req.session.isAdmin = true
        res.redirect('/books')
    } else{
        res.send("Invalid Username or Password")
    }
})
app.get('/admin/logout',(req,res)=>{
        req.session.destroy()
        res.redirect('/')
})

app.get('/about',(req,res)=>{
    res.render('about')
})

app.get('/books',async(req,res)=>{
    const books = await Book.find()
    res.render('books',{books,isAdmin:req.session.isAdmin})
})

app.get('/books/new',(req,res)=>{
    res.render('newbook')
})

app.post('/books',isAdmin,upload.single('img'), async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        price: req.body.price,
        category: req.body.category,
        img: '/uploads/' + req.file.filename
    });
    await book.save();
    res.redirect('/books');
});

app.get('/books/edit/:id',isAdmin,async (req, res) => {
    const id = req.params.id;
    const book = await Book.findById(id);
    res.render('editbook', { book });
});

app.post('/books/edit/:id',isAdmin, upload.single('img'), async (req, res) => {
    const id = req.params.id;
    const book = await Book.findById(id);
    book.title = req.body.title;
    book.author = req.body.author;
    book.price = req.body.price;
    book.category = req.body.category;
    if (req.file) {
        book.img = '/uploads/' + req.file.filename;
    }
    await book.save();
    res.redirect('/books');
});


app.post('/books/delete/:id',isAdmin,async (req, res) => {
    const id = req.params.id;
    await Book.findByIdAndDelete(id);
    res.redirect('/books');
});

app.get('/category', async (req, res) => {
    const books = await Book.find();
    const categories = [...new Set(books.map(book => book.category))];
    res.render('categories', { books, categories });
});

app.get('/category/:category', async (req, res) => {
    const category = req.params.category;
    const books = await Book.find({
        category: category
    });
    const allBooks = await Book.find();
    const categories = [...new Set(allBooks.map(book => book.category))];
    res.render('categories', { books, categories });
});

app.get('/contact',(req,res)=>{
    res.render('contact')
})

app.post('/contact', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const message = req.body.message;
    transporter.sendMail({
        to: 'tharshit390@gmail.com',
        subject: 'New Customer Message',
        text: `Name: ${name} Email: ${email} Phone: ${phone} Message: ${message}`
    }, (error) => {
        if (error) {
            console.log(error);
            res.send('Email not sent');
        } else {
            res.send(`<script>
                    alert("Message Sent Successfully!");
                    window.location.href = "/contact";
                </script>`);
        }
    });
});

app.listen(port,()=>{
    console.log("Listening on "+port)
})