1. There are 2 different admin positions, subAdmin and Admin. Both can call api routes and visit some admin pages. Only admins can visit the main admin page. Check on the client with user.privateMetadata?.isAdmin || user.privateMetadata?.isSubAdmin

4. React Hooks must be called in the exact same order in every component render.

5. Run "npm run build" after finishing long tasks to make sure the code compiles