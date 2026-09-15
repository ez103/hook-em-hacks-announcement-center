# Hook 'Em Hacks Announcements Center

This is a simple website built by Eric Zhang for Hook 'Em Hacks, where the hackathon organizers can post announcements that can be seen by participants.

This project was built with assistance from Codex.
- First, the basic toggles for Hackers and Organizers were created.
- Next, I adjusted the visual design of the website (I made it look less ugly), with different fonts and some added graphics.
- Then I (we) added added the selections for category and priority for organizers to be able to make. I decided to also allow for the organizers to make a custom category by selected "other" and then typing in a custom category name. 
- I made the tags look less ugly and be color-coded.
- I implemented the filtering function for the hackers, and added the read/unread markers.
- I also slightly redesigned the layout for the announcement posts.
- I made the toggle more visible and added a slight animation to it.

September 2026

## Run locally

Open `index.html` directly in your browser. No server, build tools, or dependencies are required.

- **Hacker view:** read announcements, newest first.
- **Organizer view:** post an announcement with a title, message, category, and priority. Categories are Logistics, Workshops, Food, General, or Other (enter a custom category). Priorities are Normal, Important, or Urgent.
- Use the header toggle to switch views. There is no authentication.
- Organizers can edit all announcement fields or delete a post with confirmation. Cancel edit leaves the saved post unchanged. Edits preserve the original posting time; edits and deletions persist after refresh.

Announcements are saved with localStorage and survive refreshes in the same browser. They are local to that browser and are not shared across devices or users. Clearing browser site data removes them. Storage behavior for directly opened files depends on your browser and its privacy settings.

Category and priority appear on each announcement and persist after refresh. Older announcements default to General and Normal. Announcements remain ordered newest first.

## Graphics

The header and footer use a custom longhorn wearing sunglasses in `assets/longhorn-sunglasses.svg`. The megaphone and coding dog are inline SVG illustrations. All graphics work without a network connection.


