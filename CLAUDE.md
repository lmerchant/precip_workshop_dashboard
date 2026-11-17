# Project Outline

## Project overview

This project is to create a data dashboard which is a web app that organizes multiple datasets with metadata into a format scientists can view all of them globally at once and individually. Each dataset will have metadata tags to filter the datasets on. The dashboard will have a search bar and buttons at the top to filter what is displayed. Each dataset's main information is displayed as horizontal cards and when the dataset card is clicked, there is a dropdown panel with more information on the dataset.

### Additonal items for the dashboard

Later on in the build, a dataset may have too much information about it to fit in a dropdown panel and the initial idea is to allow the user to click and open a tab view as a second page to view detailed information about the dataset. The dashboard is the main landing page and the viewer should be able to go back to the main dashboard easily from the dataset page and be able to see the state as it was when the dataset was selected to be opened. This design will be modified as the project progresses.

## Handoff doc

Before you compact a session and at the end of a session, update a HANDOFF.md file stored in the top folder with notes on the project and the steps to do next for the project so that the project goals can be remembered as it progresses through new sessions.

## File locations

For all documents you create for the project such as plans or memory notes, store them in the @notes folder. I will put relevant files of mine in the @docs folder. Data for the dashboard is located in the @app/data folder.

## At the end of a session

I will tell you when I will be starting a new session, and when that happens, update all docs as needed and make a commit on the develop branch.

## Skills to use

Use the frontend-ui-engineering skill found in ~/.my-claude-plugins to apply accessibility settings and the playwright-expert skill found in ~/.my-claude-plugins to use playwright to view the web pages.

## Viewing the dashboard

After each big change, show me the command to start the server so I can view the app in my browser:

```bash
cd /Users/claude/SIDE_WORK/NYCE_project/precip_workshop_dashboard/app && python3 -m http.server 3000 --bind 127.0.0.1
```

Then open http://127.0.0.1:3000/
