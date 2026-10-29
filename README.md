🛒 CartShare — Real-Time Shared Shopping List

CartShare is a web application that helps users organize shopping items and share a shopping list across multiple devices. It uses Firebase to synchronize shopping items and recent activities in real time.

🌐 Live Demo

https://layadamera.github.io/CartShare/

✨ Features

- Shared Shopping Lists: Organize shopping items in a shared room.
- Real-Time Synchronization: Keep shopping items updated across connected devices.
- Activity Tracking: View recent activities related to the shopping list.
- Item Management: Add and manage shopping items.
- Purchased Item Tracking: Track items marked as purchased.
- Activity Management: Clear recent activity records.
- Firebase Integration: Store and synchronize data using Cloud Firestore.
- Access Controls: Use Firestore security rules to restrict access to room members.

🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- Firebase Authentication
- Cloud Firestore
- GitHub Pages

🚀 Getting Started

Prerequisites

- A web browser
- A GitHub account
- A Firebase project if you want to configure your own backend

Run Locally

1. Clone the repository:
   
   git clone https://github.com/layadamera/CartShare.git

2. Open the project folder.

3. Open "index.html" in a web browser, or use a local development server.

4. If running your own instance, configure Firebase using your project's settings.

Note: The local version must use the correct Firebase configuration and authentication setup to access your existing backend.

📱 Cross-Device Support

CartShare supports synchronization across connected devices when users access the same shared room and have the required permissions.

🔐 Security

CartShare uses Firebase Authentication and Cloud Firestore security rules to control access to room data.

Users should never publish Firestore rules that allow unrestricted access to all data.

🔮 Future Improvements

- Improved user interface and accessibility
- Better shopping list organization
- Additional activity history filters
- Enhanced mobile experience
- More comprehensive automated testing

👩‍💻 Developer

Laya Damera

B.Tech — Computer Science and Engineering

📂 Source Code

https://github.com/layadamera/CartShare
📸 Project Screenshots

1. Shopping List

"CartShare Shopping List" (shopping-list.png)

2. Recent Activities

"CartShare Recent Activities" (recent-activities.png)

3. Room Information

"CartShare Room Information" (room-information.png)
