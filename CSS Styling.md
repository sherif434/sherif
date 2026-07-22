```css
body {
    background: #0f172a;
    color: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    direction: rtl;
}
.container { text-align: center; }
.orb {
    width: 150px; height: 150px;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    border-radius: 50%;
    margin: 0 auto 20px;
    cursor: pointer;
    box-shadow: 0 0 50px rgba(59, 130, 246, 0.4);
    transition: 0.5s;
}
.orb.listening {
    background: linear-gradient(45deg, #ef4444, #f59e0b);
    transform: scale(1.1);
    animation: pulse 1s infinite;
}
@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 30px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
#status-text { font-size: 24px; margin-bottom: 10px; }
#live-text { color: #94a3b8; font-style: italic; font-size: 18px; }
.commands-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 15px; margin-top: 30px;
}
.cmd-item { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 10px; font-size: 12px; }
```