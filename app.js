//jshint esversion:6

import express from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import {password} from "./MongoDB.js";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://paulplr:${password}@cluster0.lqswcrx.mongodb.net/todolistDB`, {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name Is Required"]
  }
  });

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your ToDo List"
});

const item2 = new Item ({
  name: "Hit the + button to add an item"
});

const item3 = new Item ({
  name: "<-- hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find()
    .then (items => {
      if (items.length === 0){
            Item.insertMany(defaultItems)
        .then(function(){
            console.log("Successfully saved all the items to todolistDB");
        })
        .catch(function(err){
            console.log(err);
        });

      } else {
        res.render("list", {listTitle: "Today", newListItems: items});
      }
    })  
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){  
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then(foundList => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
  })}
});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox.trim();
  const listName = _.capitalize(req.body.listName);
  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(() => {
        console.log("Succesfully deleted checked item from the default database");
        res.redirect("/");
    })
  .catch((err) => {
      console.log(err);
  });
  } else {
    List.findOneAndUpdate({name: listName},{$pull:{items: {_id: checkedItemId}}})
    .then((foundList) => {
      console.log(`Succesfully deleted checked item from the ${listName} database`);
        res.redirect("/" + listName);
    })
  .catch((err) => {
      console.log(err);
    })
  }
});


app.get("/:userChoice", function(req,res){
  const destination = _.capitalize(req.params.userChoice);

  List.findOne({name: destination})
    .then(exists => {
      if(!exists){
      console.log("list created")
      const list = new List ({
        name: destination,
        items: defaultItems
      });
      list.save().then(function(){
        res.redirect("/" + destination)
      });
    } else {
      res.render("list", {listTitle: destination, newListItems: exists.items});
    }});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen("https://capstone.cundell.com/todolist", function() {
  console.log("Server started on port todolost");
});
