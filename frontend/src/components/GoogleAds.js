import React, { useEffect, useRef } from 'react';

const GOOGLE_AD_CLIENT = 'ca-pub-2752395400696467';
const GOOGLE_AD_SLOT = '4454439618';

const GoogleAd = ({ className = '', style = {} }) => {
  const adRef = useRef(null);

  useEffect(() => {
    if (window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({});
      } catch (e) {
        // ignore duplicate push errors
      }
    }
  }, []);

  return (
    <div className={className} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={GOOGLE_AD_CLIENT}
        data-ad-slot={GOOGLE_AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAd; 