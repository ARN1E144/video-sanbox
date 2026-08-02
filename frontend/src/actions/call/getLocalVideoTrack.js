export default {

 label:"Get Local Video Track",

 run: async(ctx)=>{

    const track =
      ctx.agora?.getLocalVideoTrack();


    if(!track){

      return {
        ok:false,
        error:"NO_LOCAL_TRACK"
      };

    }


    return {

      ok:true,

      track

    };

 }

};