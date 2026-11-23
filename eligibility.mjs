// Address eligibility is intentionally conservative: no confirmed geocode means no booking eligibility.
// A separate paid booking endpoint must independently rerun these checks before taking payment.
const NORTH_ZIPS = new Set(['98660','98661','98662','98663','98664','98665','98682','98683','98684','98685','98686','98607','98671','98642','98604','97203','97211','97212','97217','97218','97220','97227','97230','97232','97233','97236','97213','97030','97080','97024','97060','97019','97209','97210','97229']);
const SOUTH_ZIPS = new Set(['97201','97202','97204','97205','97206','97214','97215','97216','97219','97221','97222','97223','97224','97225','97239','97266','97267','97269','97003','97005','97006','97007','97008','97015','97027','97034','97035','97045','97062','97068','97086','97089','97078','97079','97083','97070']);
const countyAllowed = new Set(['53011','41051','41067','41005']);
const deny = (reason) => ({eligible:false,canBook:false,canPay:false,reason,signatureMinimumUSD:30000});
export const consultationDates = (region, months=6, date=new Date()) => {
  if(!['north','south'].includes(region))return [];
  const startYear=date.getUTCFullYear(), startMonth=date.getUTCMonth();
  const results=[];
  for(let offset=0;offset<months;offset++){
    const year=startYear+Math.floor((startMonth+offset)/12), month=(startMonth+offset)%12;
    const firstDay=new Date(Date.UTC(year,month,1)).getUTCDay();
    const firstSaturday=1+(6-firstDay+7)%7;
    const day=firstSaturday+(region==='north'?0:14);
    const d=new Date(Date.UTC(year,month,day));
    if(d.toISOString().slice(0,10)<date.toISOString().slice(0,10))continue;
    results.push({date:d.toISOString().slice(0,10),region,start:'09:00',end:'17:00',timeZone:'America/Los_Angeles',confirmedAvailability:false});
  }
  return results;
};
export async function evaluateAddress(input){
 const line=String(input.addressLine||'').trim().slice(0,120);
 const city=String(input.city||'').trim().slice(0,75);
 const state=String(input.state||'').trim().toUpperCase();
 const zip=String(input.zip||'').trim();
 if(!/^\d{1,8}\s+\S.{3,}/.test(line)||!city||!['OR','WA'].includes(state)||!/^\d{5}$/.test(zip))
   return deny('Please provide a complete street address, city, state (OR or WA), and 5-digit ZIP.');
 if(!NORTH_ZIPS.has(zip)&&!SOUTH_ZIPS.has(zip))
   return deny('This ZIP is not in our approved primary consultation area. Projects outside the area are considered only as Signature Projects from $30,000.');
 const query=new URL('https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress');
 query.searchParams.set('address',[line,city,state,zip].join(', '));
 query.searchParams.set('benchmark','Public_AR_Current');
 query.searchParams.set('vintage','Current_Current');
 query.searchParams.set('format','json');
 let match;
 try{
   const res=await fetch(query,{signal:AbortSignal.timeout(8000),headers:{accept:'application/json'}});
   if(!res.ok)return deny('Address verification is temporarily unavailable. Please contact our team for review.');
   const data=await res.json();
   match=data?.result?.addressMatches?.[0];
 }catch{return deny('Address verification is temporarily unavailable. Please contact our team for review.');}
 if(!match)return deny('We could not verify that street address. Please contact our team for a manual service-area review.');
 const parts=match.addressComponents||{}, coordinates=match.coordinates||{};
 const lat=Number(coordinates.y), lon=Number(coordinates.x);
 const matchedZip=String(parts.zip||'');
 const counties=match.geographies?.Counties||match.geographies?.['Counties']||[];
 const county=counties[0]||{};
 const geoid=String(county.GEOID||'');
 const matchedState=String(parts.state||'').toUpperCase();
 if(matchedZip!==zip||matchedState!==state||!countyAllowed.has(geoid)||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<45.28||lat>45.88||lon< -123.20||lon> -122.20)
   return deny('The verified address falls outside our approved Portland–Vancouver consultation area. Signature Projects from $30,000 may be reviewed separately.');
 const region=NORTH_ZIPS.has(zip)?'north':'south';
 return {eligible:true,canBook:false,canPay:false,region,verifiedCity:parts.city||city,verifiedZip:zip,schedulingGroup:region==='north'?'First Saturday: Vancouver / North Portland / Gresham':'Third Saturday: South / Southeast / Southwest Portland',consultationFeeUSD:120,creditIfConstructionProceeds:true,plannedDates:consultationDates(region),reason:'Address verified for consultation-area screening. Appointment slots and payments are not active until a separate server-side booking integration is enabled.'};
}
