import React, { useContext } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatContainer from '../components/ChatContainer.jsx';
import RightSidebar from '../components/RightSidebar.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';

const HomePage = () => {
  const { selectedUser, selectedRoom } = useContext(ChatContext);
  const hasSelection = selectedUser || selectedRoom;

  return (
    <div className='w-full h-screen sm:px-[8%] sm:py-[2.5%] relative z-10'>
      <div
        className={`
          neu-card overflow-hidden h-full grid
          ${hasSelection
            ? 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]'
            : 'grid-cols-1 md:grid-cols-2'
          }
        `}
      >
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage;
