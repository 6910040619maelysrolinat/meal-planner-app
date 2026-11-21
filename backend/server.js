import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { sql, mongo } from './db.js';
import { auth } from './middleware.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const own = (table) => `SELECT * FROM ${table} WHERE user_id = ?`;
const collections = {
  reviews: 'recipe_reviews',
  carts: 'shopping_carts',
  notifications: 'notifications'
};

app.get('/api/health', asyncRoute(async (_req,res) => {
  await sql.query('SELECT 1');
  await mongo.command({ ping: 1 });
  res.json({ ok:true, sql:'connected', mongodb:'connected' });
}));

app.post('/api/auth/register', asyncRoute(async (req,res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) return res.status(400).json({error:'Name, email and password (at least 8 characters) are required'});
  const hash = await bcrypt.hash(password, 10);
  const [result] = await sql.execute('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)',[name,email.toLowerCase(),hash]);
  const token = jwt.sign({id:result.insertId,email:email.toLowerCase()}, process.env.JWT_SECRET || 'development_secret', {expiresIn:'7d'});
  res.status(201).json({token,user:{id:result.insertId,name,email}});
}));
app.post('/api/auth/login', asyncRoute(async (req,res) => {
  const { email,password } = req.body;
  const [rows] = await sql.execute('SELECT * FROM users WHERE email=?',[String(email || '').toLowerCase()]);
  if (!rows[0] || !(await bcrypt.compare(password || '', rows[0].password_hash))) return res.status(401).json({error:'Incorrect email or password'});
  const user = rows[0];
  const token = jwt.sign({id:user.id,email:user.email}, process.env.JWT_SECRET || 'development_secret', {expiresIn:'7d'});
  res.json({token,user:{id:user.id,name:user.name,email:user.email}});
}));

app.use('/api', auth);
app.get('/api/me', asyncRoute(async(req,res)=>{
  const [[user]]=await sql.execute('SELECT id,name,email FROM users WHERE id=?',[req.user.id]);
  if(!user) return res.status(404).json({error:'Account not found'});
  res.json(user);
}));

function sqlCrud(path, table, fields, required=[]) {
  app.get(`/api/${path}`, asyncRoute(async(req,res)=>{
    const [rows] = await sql.query(own(table),[req.user.id]); res.json(rows);
  }));
  app.post(`/api/${path}`, asyncRoute(async(req,res)=>{
    for (const f of required) if (req.body[f] === undefined || req.body[f] === '') return res.status(400).json({error:`${f} is required`});
    const vals = fields.map(f => req.body[f] ?? null);
    const [r] = await sql.execute(`INSERT INTO ${table} (user_id,${fields.join(',')}) VALUES (${['?','?'].concat(fields.slice(1).map(()=>'?')).join(',')})`,[req.user.id,...vals]);
    const [rows] = await sql.execute(`SELECT * FROM ${table} WHERE id=? AND user_id=?`,[r.insertId,req.user.id]); res.status(201).json(rows[0]);
  }));
  app.get(`/api/${path}/:id`, asyncRoute(async(req,res)=>{
    const [rows] = await sql.execute(`SELECT * FROM ${table} WHERE id=? AND user_id=?`,[req.params.id,req.user.id]);
    if(!rows[0]) return res.status(404).json({error:'Not found'}); res.json(rows[0]);
  }));
  app.put(`/api/${path}/:id`, asyncRoute(async(req,res)=>{
    const updates = fields.filter(f => req.body[f] !== undefined);
    if(!updates.length) return res.status(400).json({error:'No fields to update'});
    const values = updates.map(f=>req.body[f]);
    const [r] = await sql.execute(`UPDATE ${table} SET ${updates.map(f=>`${f}=?`).join(',')} WHERE id=? AND user_id=?`,[...values,req.params.id,req.user.id]);
    if(!r.affectedRows) return res.status(404).json({error:'Not found'});
    const [rows] = await sql.execute(`SELECT * FROM ${table} WHERE id=?`,[req.params.id]); res.json(rows[0]);
  }));
  app.delete(`/api/${path}/:id`, asyncRoute(async(req,res)=>{
    const [r] = await sql.execute(`DELETE FROM ${table} WHERE id=? AND user_id=?`,[req.params.id,req.user.id]);
    if(!r.affectedRows) return res.status(404).json({error:'Not found'}); res.json({deleted:true});
  }));
}
sqlCrud('recipes','recipes',['title','description','instructions','prep_minutes','servings'],['title']);
sqlCrud('ingredients','ingredients',['name','unit'],['name']);
sqlCrud('meal-plans','meal_plans',['plan_date','meal_type','recipe_id'],['plan_date','meal_type']);
sqlCrud('shopping-list','shopping_list',['item_name','quantity','unit','is_purchased'],['item_name']);

app.get('/api/recipe-ingredients', asyncRoute(async(req,res)=>{
  const [rows]=await sql.execute(`SELECT ri.* FROM recipe_ingredients ri JOIN recipes r ON r.id=ri.recipe_id WHERE r.user_id=?`,[req.user.id]); res.json(rows);
}));
app.post('/api/recipe-ingredients', asyncRoute(async(req,res)=>{
  const {recipe_id,ingredient_id,quantity}=req.body;
  const [[r]] = await sql.execute('SELECT id FROM recipes WHERE id=? AND user_id=?',[recipe_id,req.user.id]);
  const [[i]] = await sql.execute('SELECT id FROM ingredients WHERE id=? AND user_id=?',[ingredient_id,req.user.id]);
  if(!r||!i) return res.status(400).json({error:'Choose your own recipe and ingredient'});
  const [result]=await sql.execute('INSERT INTO recipe_ingredients (recipe_id,ingredient_id,quantity) VALUES (?,?,?)',[recipe_id,ingredient_id,quantity||1]);
  res.status(201).json({id:result.insertId,recipe_id,ingredient_id,quantity:quantity||1});
}));
app.put('/api/recipe-ingredients/:id', asyncRoute(async(req,res)=>{
  const [result]=await sql.execute(`UPDATE recipe_ingredients ri JOIN recipes r ON r.id=ri.recipe_id SET ri.quantity=? WHERE ri.id=? AND r.user_id=?`,[req.body.quantity,req.params.id,req.user.id]);
  if(!result.affectedRows) return res.status(404).json({error:'Not found'}); res.json({updated:true});
}));
app.delete('/api/recipe-ingredients/:id', asyncRoute(async(req,res)=>{
  const [result]=await sql.execute(`DELETE ri FROM recipe_ingredients ri JOIN recipes r ON r.id=ri.recipe_id WHERE ri.id=? AND r.user_id=?`,[req.params.id,req.user.id]);
  if(!result.affectedRows) return res.status(404).json({error:'Not found'}); res.json({deleted:true});
}));

async function mongoCrud(path, collectionName) {
  const col=mongo.collection(collectionName);
  app.get(`/api/${path}`,asyncRoute(async(req,res)=>res.json(await col.find({userId:req.user.id}).sort({createdAt:-1}).toArray())));
  app.post(`/api/${path}`,asyncRoute(async(req,res)=>{
    if(collectionName==='recipe_reviews') {
      const [[recipe]]=await sql.execute('SELECT id FROM recipes WHERE id=? AND user_id=?',[req.body.recipeId,req.user.id]);
      if(!recipe) return res.status(400).json({error:'Choose one of your own recipes for this review'});
      if(Number(req.body.rating)<1||Number(req.body.rating)>5) return res.status(400).json({error:'Rating must be between 1 and 5'});
    }
    const doc={...req.body}; delete doc._id; delete doc.userId; doc.userId=req.user.id; doc.createdAt=new Date();
    const result=await col.insertOne(doc); res.status(201).json({...doc,_id:result.insertedId});
  }));
  app.put(`/api/${path}/:id`,asyncRoute(async(req,res)=>{
    if(!ObjectId.isValid(req.params.id)) return res.status(400).json({error:'Invalid id'});
    const changes={...req.body}; delete changes._id; delete changes.userId; delete changes.createdAt;
    if(collectionName==='recipe_reviews') {
      if(changes.recipeId!==undefined) {
        const [[recipe]]=await sql.execute('SELECT id FROM recipes WHERE id=? AND user_id=?',[changes.recipeId,req.user.id]);
        if(!recipe) return res.status(400).json({error:'Choose one of your own recipes for this review'});
      }
      if(changes.rating!==undefined&&(Number(changes.rating)<1||Number(changes.rating)>5)) return res.status(400).json({error:'Rating must be between 1 and 5'});
    }
    const result=await col.updateOne({_id:new ObjectId(req.params.id),userId:req.user.id},{$set:changes});
    if(!result.matchedCount) return res.status(404).json({error:'Not found'}); res.json({updated:true});
  }));
  app.delete(`/api/${path}/:id`,asyncRoute(async(req,res)=>{
    if(!ObjectId.isValid(req.params.id)) return res.status(400).json({error:'Invalid id'});
    const result=await col.deleteOne({_id:new ObjectId(req.params.id),userId:req.user.id});
    if(!result.deletedCount) return res.status(404).json({error:'Not found'}); res.json({deleted:true});
  }));
}
await mongoCrud('reviews',collections.reviews);
await mongoCrud('carts',collections.carts);
await mongoCrud('notifications',collections.notifications);
await mongoCrud('activity-logs','activity_logs');

app.post('/api/meal-plans/:id/confirm',asyncRoute(async(req,res)=>{
  const connection=await sql.getConnection();
  let committed=false;
  try {
    await connection.beginTransaction();
    const [plans]=await connection.execute('SELECT * FROM meal_plans WHERE id=? AND user_id=? FOR UPDATE',[req.params.id,req.user.id]);
    if(!plans[0]) { const e=new Error('Meal plan not found'); e.status=404; throw e; }
    if(plans[0].status==='confirmed') { const e=new Error('Meal plan is already confirmed'); e.status=409; throw e; }
    await connection.execute('UPDATE meal_plans SET status=? WHERE id=? AND user_id=?',['confirmed',req.params.id,req.user.id]);
    await connection.execute('INSERT INTO meal_plan_confirmations (meal_plan_id,user_id) VALUES (?,?)',[req.params.id,req.user.id]);
    if(req.query.forceRollback==='true') throw new Error('Forced demonstration error: rollback requested');
    await connection.commit(); committed=true;
    await mongo.collection('activity_logs').insertOne({userId:req.user.id,action:'MEAL_PLAN_CONFIRMED',entity:'meal_plan',entityId:Number(req.params.id),details:{status:'committed'},createdAt:new Date()});
    await mongo.collection('notifications').insertOne({userId:req.user.id,message:`Meal plan #${req.params.id} confirmed`,type:'success',read:false,createdAt:new Date()});
    res.json({success:true,message:'Meal plan confirmed and MongoDB synchronized'});
  } catch(error) {
    if(!committed) {
      await connection.rollback();
      await mongo.collection('activity_logs').insertOne({userId:req.user.id,action:'MEAL_PLAN_ROLLBACK',entity:'meal_plan',entityId:Number(req.params.id),details:{reason:error.message},createdAt:new Date()});
    } else {
      await mongo.collection('activity_logs').insertOne({userId:req.user.id,action:'MONGO_SYNC_FAILED',entity:'meal_plan',entityId:Number(req.params.id),details:{reason:error.message,sqlTransaction:'committed'},createdAt:new Date()});
    }
    throw error;
  } finally { connection.release(); }
}));

app.use((err,_req,res,_next)=>{
  console.error(err);
  res.status(err.status || 500).json({error:err.message || 'Internal server error'});
});
const port=Number(process.env.PORT||5000);
app.listen(port,()=>console.log(`Meal Planner API running on http://localhost:${port}`));
