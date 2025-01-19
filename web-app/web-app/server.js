const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb://mongodb:27017/recipes', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Define Recipe Schema
const recipeSchema = new mongoose.Schema({
    title: String,
    ingredients: [String],
    instructions: String,
});

const Recipe = mongoose.model('Recipe', recipeSchema);

// Shared Navigation
const getNavigation = () => `
    <nav>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; gap: 20px; background: #f4f4f4; padding: 10px; border-bottom: 1px solid #ddd;">
            <li><a href="/recipes" style="text-decoration: none; color: #007bff;">Recipes</a></li>
            <li><a href="/about" style="text-decoration: none; color: #007bff;">About</a></li>
            <li><a href="/enter-recipe" style="text-decoration: none; color: #007bff;">Enter Recipe</a></li>
        </ul>
    </nav>
`;

// Route to display all recipes as clickable cards
app.get('/recipes', async (req, res) => {
    const recipes = await Recipe.find();
    let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recipes</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 800px;
                    margin: 20px auto;
                    padding: 10px;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .card {
                    margin-bottom: 20px;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .card a {
                    text-decoration: none;
                    color: #007bff;
                    font-weight: bold;
                }
                .card a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            ${getNavigation()}
            <div class="container">
                <h1>Recipes</h1>
                ${recipes.map(recipe => `
                    <div class="card">
                        <h2><a href="/recipes/${recipe._id}">${recipe.title}</a></h2>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;
    res.send(htmlContent);
});

// Route to display a single recipe's details
app.get('/recipes/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).send('<h1>Recipe not found</h1>');
        }
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${recipe.title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f9f9f9;
                    }
                    .container {
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 10px;
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                </style>
            </head>
            <body>
                ${getNavigation()}
                <div class="container">
                    <h1>${recipe.title}</h1>
                    <h4>Ingredients:</h4>
                    <ul>
                        ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                    <p><strong>Instructions:</strong> ${recipe.instructions}</p>
                </div>
            </body>
            </html>
        `;
        res.send(htmlContent);
    } catch (err) {
        res.status(500).send('<h1>Server Error</h1>');
    }
});

// Route to show the form for entering a recipe
app.get('/enter-recipe', (req, res) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enter Recipe</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 800px;
                    margin: 20px auto;
                    padding: 10px;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                input, textarea {
                    padding: 10px;
                    font-size: 1rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    width: 100%;
                }
                button {
                    padding: 10px;
                    font-size: 1rem;
                    color: #fff;
                    background-color: #007bff;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            ${getNavigation()}
            <div class="container">
                <h1>Enter Recipe</h1>
                <form action="/enter-recipe" method="POST">
                    <input type="text" name="title" placeholder="Recipe Title" required />
                    <textarea name="ingredients" placeholder="Ingredients (comma-separated)" required></textarea>
                    <textarea name="instructions" placeholder="Instructions" required></textarea>
                    <button type="submit">Add Recipe</button>
                </form>
            </div>
        </body>
        </html>
    `;
    res.send(htmlContent);
});

// POST route to handle form submissions
app.post('/enter-recipe', async (req, res) => {
    const { title, ingredients, instructions } = req.body;
    const recipe = new Recipe({
        title,
        ingredients: ingredients.split(',').map(ing => ing.trim()),
        instructions,
    });
    await recipe.save();
    res.redirect('/recipes');
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

