const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const secret = 'bc6245bb8f7b9f164101f07918dac4cd9eb0aac666aba5c8c8be370174c2369ae79b60b92d98ed20e54643fae0331845543b514a2772bbabc78cc6190045e21b';
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/project2', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema =new mongoose.Schema({
  username:{type:String,unique:true},
  password:String
})
const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  category: String,
});

const User=mongoose.model('User', userSchema)
const Question = mongoose.model('Question', questionSchema);

app.post('/add-question', async (req, res) => {
  const { question, options, answer, category } = req.body;
  const newQuestion = new Question({ question, options, answer, category });
  await newQuestion.save();
  res.send('Question added!');
});

app.get('/categories', async (req, res) => {
  const categories = await Question.distinct('category');
  res.json(categories);
});

app.get('/questions', async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

app.get('/questions/:category', async (req, res) => {
  const { category } = req.params;
  const questions = await Question.find({ category });
  res.json(questions);
});

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = new User({ username, password }); // Save plain text password
    await newUser.save();
    res.send('User registered!');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send('Error registering user');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Error logging in');
  }
});

// Middleware to authenticate user
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).send('Unauthorized');
      } else {
        req.userId = decoded.userId;
        next();
      }
    });
  } else {
    res.status(401).send('Unauthorized');
  }
};

const progressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  category: String,
  correctAnswers: Number,
  wrongAnswers: Number,
});

const Progress = mongoose.model('Progress', progressSchema);

app.post('/save-progress', authenticate, async (req, res) => {
  const { category, correctAnswers, wrongAnswers } = req.body;
  const progress = new Progress({
    userId: req.userId,
    category,
    correctAnswers,
    wrongAnswers,
  });
  await progress.save();
  res.send('Progress saved!');
});

app.get('/progress', authenticate, async (req, res) => {
  const progress = await Progress.find({ userId: req.userId });
  res.json(progress);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});