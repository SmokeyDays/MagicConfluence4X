<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { NButton, NSpace, NFloatButton, NIcon, NBadge } from 'naive-ui';
import { NConfigProvider, darkTheme, type GlobalThemeOverrides, NGlobalStyle } from 'naive-ui';
import HomePage from '@/pages/HomePage.vue';
import LobbyPage from '@/pages/LobbyPage.vue';
import HexMapPage from '@/pages/HexMapPage.vue';
import AlertList from '@/components/AlertList.vue';
import { socket } from '@/utils/connect';
import type { GameState } from './interfaces/GameState';
import type { RoomList } from './interfaces/RoomState';
import Logo from '@/components/Logo.vue';
import { BOT_FEATURE_ENABLED, isProduction } from './utils/config';
import { messageEqual, type Message } from './interfaces/ChatState';
import ChatPanel from '@/components/panels/ChatPanel.vue';
import RulesPanel from '@/components/panels/RulesPanel.vue';
import { checkUsername, type Achievement } from './interfaces/UserState';
import AchievementPanel from './components/panels/AchievementPanel.vue';
import UtilsPanel from './components/panels/UtilsPanel.vue';

import IconChat from '@/components/icons/IconChat.vue';
import IconRules from '@/components/icons/IconRules.vue';
import Achievement3 from './components/icons/alerts/Achievement3.vue';
import IconUtils from './components/icons/IconUtils.vue';
import IconRobot from './components/icons/IconRobot.vue';
import { pubMsg } from './utils/general';
import { sidConThemeOverrides } from './interfaces/MagicConTheme';
import { generateMockGame } from './utils/mock';

const rooms = ref<RoomList>({});
const displayPage = ref('home');
const username = ref(isProduction? '': 'Alice');
const messages = ref<Message[]>([]);
const currentRoom = ref('');
const displayPureText = ref(false);
const pureText = ref('');

const switchPage = (page: string) => {
  displayPage.value = page;
};

const switchPureTextMode = () => {
  displayPureText.value = !displayPureText.value;
};

const gameState = ref<GameState>(generateMockGame());

const setCurrentRoom = (room: string) => {
  currentRoom.value = room;
};

socket.on('game-state', (data: {state: GameState}) => {
  gameState.value = data.state;
  if (displayPureText.value) {
    socket.emit('query-prompt', {room_name: currentRoom.value, username: username.value});
  }
  console.log(data);
});

socket.on('room-list', (data: {rooms: RoomList}) => {
  rooms.value = data.rooms;
  console.log(data);
});

const submitUsername = (newUsername: string) => {
  if (checkUsername(newUsername)) {
    socket.emit('login',{username: newUsername, oldname: username.value});
  } else {
    pubMsg('错误！', '用户名格式不正确！','error', 2);
  }
};

const login = (newUsername: string) => {
  username.value = newUsername;
  localStorage.setItem('username', username.value);
}

socket.on('login-success', (data: any) => {
  login(data['username']);
  pubMsg('登录成功！', '欢迎！ ' + username.value, 'success', 2);
  switchPage('lobby');
});

const logout = () => {
  socket.emit('logout', {username: username.value});
  username.value = '';
  localStorage.removeItem('username');
}

const sendAdminCommand = (code: string) => {
  if (!code) return;
  console.log(`[Admin] Sending command: ${code}`);
  // 发送信号
  socket.emit('admin-command', code);
};

onMounted(() => {
  pubMsg('欢迎！', '客户端启动成功！', 'success', 2);
  socket.emit('get-room-list');

  (window as any).admin = sendAdminCommand;
  console.log('✅ Admin console command loaded. Use admin("code") to execute.');
})

onUnmounted(() => {
  if (username.value !== '') {
    socket.emit('logout', {username: username.value});
  }
})

const addMessage = (message: Message) => {
  messages.value.sort((a, b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    return aDate.getTime() - bDate.getTime();
  });
  if (messages.value.length > 0 && messageEqual(messages.value[messages.value.length - 1], message)) {
    return;
  }
  pubMsg('新消息！', message.sender + ": " + message.msg, 'info', 2);
  messages.value.push(message);
}

const sendMessage = (msg: string, room: string | null, user: string | null) => {
  const newMessage: Message = {
    sender: username.value,
    msg: msg,
    date: new Date().toISOString(),
    room: room,
    user: user,
  };
  addMessage(newMessage);
  socket.emit('send-message', newMessage);
};

socket.on('new-message', (data: {msg: Message}) => {
  addMessage(data.msg);
});
socket.on('sync-chat', (data: {msgs: Message[]}) => {
  console.log(data);
  messages.value = data.msgs;
  pubMsg('聊天同步', '聊天同步成功！同步了' + data.msgs.length + '条消息！', 'success', 2);
});
socket.on('add-achievement', (data: {achievement: Achievement, username: string}) => {
  pubMsg(data.achievement.name, data.achievement.description, 'warning', 30);
});

const displayMessagePanel = ref(false);

const getDisplayMessagePanel = () => {
  return displayMessagePanel.value && username.value !== '';
}

const viewedCount = ref(0);

const openMessagePanel = () => {
  displayMessagePanel.value = true;
}

const closeMessagePanel = () => {
  displayMessagePanel.value = false;
}

const readMessage = (msg: Message) => {
  viewedCount.value = messages.value.length;
}

const displayRulesPanel = ref(false);

const openRulesPanel = () => {
  displayRulesPanel.value = true;
};

const closeRulesPanel = () => {
  displayRulesPanel.value = false;
};

const displayAchievementPanel = ref(false);
const getDisplayAchievementPanel = () => {
  return displayAchievementPanel.value && username.value !== '';
};
const closeAchievementPanel = () => {
  displayAchievementPanel.value = false;
};

const openAchievementPanel = () => {
  displayAchievementPanel.value = true;
  socket.emit('query-achievement', {username: username.value});
};

const displayUtilsPanel = ref(false);

const openUtilsPanel = () => {
  displayUtilsPanel.value = true;
}

const closeUtilsPanel = () => {
  displayUtilsPanel.value = false;
}

const achievements = ref<Achievement[]>([]);
socket.on('sync-achievements', (data: {achievements: Record<string, Achievement>}) => {
  console.log(data);
  achievements.value = Object.values(data.achievements);
});

onMounted(() => {
  const savedUsername = localStorage.getItem('username');
  if (savedUsername) {
    submitUsername(savedUsername);
  }
})
</script>

<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="sidConThemeOverrides">
    <n-global-style />
    
    <div class="magic-background">
      <div class="texture-overlay"></div>
    </div>

    <div class="app">
      <template v-if="displayPage === 'home'">
        <HomePage :submitUsername="submitUsername" />
      </template>
      <!-- <template v-else-if="displayPage === 'game'">
        <template v-if="displayPureText">
          <GamePureTextPage :username="username" :gameState="gameState" :rooms="rooms"/>
        </template>
        <template v-else>
          <GamePage :gameProps="gameProps" :updateGameProps="updateGameProps" :username="username" :gameState="gameState" :switchPage="switchPage"/>
        </template>
      </template> -->
      <template v-else-if="displayPage === 'lobby'">
        <LobbyPage 
          :rooms="rooms" 
          :username="username" 
          :switchPage="switchPage" 
          :currentRoom="currentRoom" 
          :setCurrentRoom="setCurrentRoom" 
          :logout="logout"
        />
      </template>
      <template v-else-if="displayPage === 'hexmap'">
        <HexMapPage />
      </template>

      <AlertList/>
      <ChatPanel
        v-if="getDisplayMessagePanel()"
        :sendMessage="sendMessage"
        :messages="messages"
        :rooms="rooms"
        :username="username"
        :currentRoom="currentRoom"
        :closeMessagePanel="closeMessagePanel"
        :readMessage="readMessage"
      />
      <AchievementPanel 
        v-if="getDisplayAchievementPanel()" 
        :closeAchievementPanel="closeAchievementPanel" 
        :achievements="achievements" 
      />
      <UtilsPanel v-if="displayUtilsPanel" :closeUtilsPanel="closeUtilsPanel" />
      <RulesPanel v-if="displayRulesPanel" :closeRulesPanel="closeRulesPanel" />

      <div class="system-dock" v-if="username !== ''">
        <div class="dock-deco-line"></div>
        
        <n-button class="dock-btn" @click="openMessagePanel" type="primary" secondary>
           <template #icon><n-icon><IconChat /></n-icon></template>
           <n-badge :value="messages.length - viewedCount" :max="99" :offset="[5, -5]" class="dock-badge" />
           MSG
        </n-button>

        <n-button class="dock-btn" @click="openRulesPanel" type="primary" secondary>
           <template #icon><n-icon><IconRules /></n-icon></template>
           DATA
        </n-button>

        <n-button class="dock-btn" @click="openAchievementPanel" type="primary" secondary>
           <template #icon><n-icon><Achievement3 /></n-icon></template>
           ACHV
        </n-button>

        <n-button class="dock-btn" v-if="displayPage === 'game'" @click="openUtilsPanel" type="primary" secondary>
           <template #icon><n-icon><IconUtils /></n-icon></template>
           TOOLS
        </n-button>

        <n-button class="dock-btn" v-if="displayPage === 'game' && BOT_FEATURE_ENABLED" @click="switchPureTextMode" :type="displayPureText ? 'warning' : 'primary'" secondary>
           <template #icon><n-icon><IconRobot /></n-icon></template>
           {{ displayPureText ? 'GUI' : 'TXT' }}
        </n-button>

        <n-button class="dock-btn" @click="switchPage('hexmap')" type="primary" secondary>
           <template #icon><n-icon><IconUtils /></n-icon></template>
           MAP
        </n-button>
      </div>
      
    </div>
  </n-config-provider>
</template>

<style scoped>
/* 引入魔法/古典字体 */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=MedievalSharp&display=swap');

/* 全局布局 */
.app {
  width: 100vw;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  /* 使用古典魔法字体 */
  font-family: 'MedievalSharp', 'Cinzel', serif;
  color: var(--magic-text);
}

/* --- 背景特效 --- */
.magic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background-color: var(--magic-bg);
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(100, 50, 150, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* 纹理叠加 (取代网格) */
.texture-overlay {
  width: 100%;
  height: 100%;
  /* 模拟古老羊皮纸/魔法迷雾的噪点或微纹理 */
  background-image: 
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.02) 0px, rgba(255, 255, 255, 0.02) 1px, transparent 1px, transparent 10px),
    repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.02) 0px, rgba(255, 255, 255, 0.02) 1px, transparent 1px, transparent 10px);
  mask-image: radial-gradient(circle, black 60%, transparent 100%);
}

/* --- 底部系统坞 (System Dock) - 魔法风格 --- */
.system-dock {
  position: fixed;
  bottom: 30px; /* 稍微抬高 */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  padding: 12px 25px;
  
  /* 木质/黑曜石风格背景 */
  background: var(--magic-bg-card); /* 深色背景 */
  
  /* 金色边框 */
  border: 2px solid var(--magic-border);
  border-radius: 16px; /* 圆润边角 */
  
  /* 奥术光晕 */
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5), /* 阴影 */
    0 0 20px rgba(212, 175, 55, 0.2), /* 金色微光 */
    inset 0 0 10px rgba(0, 0, 0, 0.5); /* 内阴影增加厚度感 */
    
  backdrop-filter: blur(8px);
  z-index: 1000;
  
  /* 移除切角，改为古典装饰 */
  clip-path: none;
}

/* 装饰线 - 改为顶部金色镶边 */
.dock-deco-line {
  position: absolute;
  top: 4px;
  left: 10%;
  width: 80%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--magic-border), transparent);
}

.dock-btn {
  height: 48px;
  font-family: 'Cinzel', serif; /* 标题/按钮使用 Cinzel */
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--magic-primary);
}

/* 覆盖 Naive UI 内部样式 */
:deep(.n-button) {
  background-color: transparent;
  border-radius: 8px;
  transition: all 0.3s ease;
}
:deep(.n-button:hover) {
  background-color: var(--magic-primary-suppl);
  box-shadow: 0 0 15px var(--magic-primary-suppl);
  color: var(--magic-primary-hover);
  transform: translateY(-2px); /* 悬浮效果 */
}
:deep(.n-button .n-icon) {
  color: var(--magic-primary);
}

/* 聊天气泡位置微调 */
.dock-badge {
  position: absolute;
  top: 2px;
  right: 2px;
}
</style>