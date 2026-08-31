Here's everything left incomplete or broken:

🔴 Broken (needs fixing before the app works)
Backend can't build — zod and express-rate-limit never installed in node_modules. Run npm install in backend/ to fix. Nothing else works until this is done.
🟡 Partially done (code exists but not working)
Column drag-and-drop — the SortableContext for columns was added at the board level but the individual Column component was never wrapped in useSortable. Columns can't actually be dragged yet.
Backend tests — 4 of 5 suites fail. board.test.ts still has old duplicate const CREATE_BOARD declarations at the bottom. @types/jest couldn't be installed due to a Windows file lock.
🟠 Left off the todo list
Profile README needs its own repo — profile-README.md is sitting in the DevBoard repo. For GitHub to show it on your profile, you need a repo named exactly Bokka-kartik with a README.md — it can't live here.
bupdate/fupdate/new updates/rupdates folders committed — th
