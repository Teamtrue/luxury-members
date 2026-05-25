// PlutusClub signup flow — canvas of 8 iOS screens.

const SCREENS = [
  { id: 'welcome',    label: '01 · Welcome',     Comp: ScreenWelcome },
  { id: 'phone',      label: '02 · Phone',       Comp: ScreenPhone },
  { id: 'otp',        label: '03 · Verify',      Comp: ScreenOTP },
  { id: 'name',       label: '04 · Profile',     Comp: ScreenName },
  { id: 'tier',       label: '05 · Tier',        Comp: ScreenTier },
  { id: 'categories', label: '06 · Categories',  Comp: ScreenCategories },
  { id: 'payment',    label: '07 · Payment',     Comp: ScreenPayment },
  { id: 'done',       label: '08 · Admitted',    Comp: ScreenDone },
];

function ScreenInDevice({ Comp }) {
  return (
    <IOSDevice width={390} height={844}>
      <Comp />
    </IOSDevice>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="signup"
        title="PlutusClub · iOS signup"
        subtitle="8 screens — phone-first onboarding into a private buying club. Obsidian + champagne gold. Drag to reorder, click to focus."
      >
        {SCREENS.map(({ id, label, Comp }) => (
          <DCArtboard key={id} id={id} label={label} width={390} height={844}>
            <div data-screen-label={label} style={{ width: '100%', height: '100%' }}>
              <ScreenInDevice Comp={Comp}/>
            </div>
          </DCArtboard>
        ))}
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
