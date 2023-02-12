const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const format = require("date-fns");

const app = express();
app.use(express.json());

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const priorityAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearch_q = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

const categoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hascategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const categoryAndpriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const convertToResponseObj = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};
app.get("/todos/", async (request, response) => {
  try {
    const { search_q = "", status, priority, category } = request.query;
    let responseQuery = "";
    let todoQuery = "";
    switch (true) {
      case hasStatus(request.query):
        todoQuery = `
            SELECT *
            FROM todo
            WHERE 
            status = '${status}';`;
        break;
      case hasPriority(request.query):
        todoQuery = `
            SELECT*
            FROM todo 
            WHERE priority = '${priority}'`;
        break;
      case priorityAndStatus(request.query):
        todoQuery = `
            SELECT*
            FROM todo
            WHERE priority = '${priority}' AND 
            status = '${status}';`;
        break;
      case categoryAndStatus(request.query):
        todoQuery = `
            SELECT*
            FROM todo
            WHERE category = '${category}' AND 
            status = '${status}';`;
        break;
      case hascategory(request.query):
        todoQuery = `
            SELECT*
            FROM todo
            WHERE category = '${category}';`;
        break;
      case categoryAndpriority(request.query):
        todoQuery = `
            SELECT*
            FROM todo
            WHERE category = '${category}' AND
            priority = '${priority}';`;
        break;
      default:
        todoQuery = `
            SELECT*
            FROM todo
            WHERE todo LIKE '%${search_q}%';`;
        break;
    }

    responseQuery = await db.all(todoQuery);
    response.send(
      responseQuery.map((eachOne) => convertToResponseObj(eachOne))
    );
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoIdQuery = `
    SELECT * 
    FROM todo WHERE id=${todoId};`;
  const response2 = await db.get(todoIdQuery);
  response.send(convertToResponseObj(response2));
});

app.get("/agenda/", async (request, response) => {
  const date = format(new Date(2021, 1, 21), "yyyy-MM-dd");
  const agendaQuery = `
    SELECT * FROM todo WHERE due_date=${date};`;
  const DateResponse = await db.get(agendaQuery);
  response.send(DateResponse);
});

app.post("/todos/", async (request, response) => {
  try {
    const { id, todo, priority, status, category, dueDate } = request.body;
    const postQuery = `
    INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
    await db.run(postQuery);
    response.send("Todo Successfully Added");
  } catch (e) {
    console.log(`postQueryError:${e.message}`);
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    let updateColumn = "";
    const requestBody = request.body;
    switch (true) {
      case requestBody.status !== undefined:
        updateColumn = "Status";
        break;
      case requestBody.priority !== undefined:
        updateColumn = "Priority";
        break;
      case requestBody.todo !== undefined:
        updateColumn = "Todo";
        break;
      case requestBody.category !== undefined:
        updateColumn = "Category";
        break;
      case requestBody.dueDate !== undefined:
        updateColumn = "Due Date";
    }
    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
    const previousTodo = await db.get(previousTodoQuery);

    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
    } = request.body;

    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}'
    WHERE
      id = ${todoId};`;

    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } catch (e) {
    console.log(`putQueryError:${e.message}`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM
    todo WHERE 
    id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
