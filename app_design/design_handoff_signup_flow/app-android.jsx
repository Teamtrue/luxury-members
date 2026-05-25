// PlutusClub signup flow — Android canvas. Same 8 screens, Android device chrome.

const ANDROID_SCREENS = [
  { id: 'welcome',    label: '01 · Welcome',     Comp: ScreenWelcome },
  { id: 'phone',      label: '02 · Phone',       Comp: ScreenPhone },
  { id: 'otp',        label: '03 · Verify',      Comp: ScreenOTP },
  { id: 'name',       label: '04 · Profile',     Comp: ScreenName },
  { id: 'tier',       label: '05 · Tier',        Comp: ScreenTier },
  { id: 'categories', label: '06 · Categories',  Comp: ScreenCategories },
  { id: 'payment',    label: '07 · Payment',     Comp: ScreenPayment },
  { id: 'done',       label: '08 · Admitted',    Comp: ScreenDone },
];

function ScreenInAndroid({ Comp }) {
  return (
    <AndroidDevice width={412} height={892}>
      <Comp />
    </AndroidDevice>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="signup-android"
        title="PlutusClub · Android signup"
        subtitle="8 screens — same flow, Android device chrome. Obsidian + champagne gold. Drag to reorder, click to focus."
      >
        {ANDROID_SCREENS.map(({ id, label, Comp }) => (
          <DCArtboard key={id} id={id} label={label} width={412} height={892}>
            <div data-screen-label={label} style={{ width: '100%', height: '100%' }}>
              <ScreenInAndroid Comp={Comp}/>
            </div>
          </DCArtboard>
        ))}
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
