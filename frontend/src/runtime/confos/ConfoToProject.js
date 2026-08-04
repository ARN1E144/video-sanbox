// =====================================================
// ConfoToProject
// -----------------------------------------------------
// Converts a Confo configuration into a project schema
// that the Canvas understands.
//
// Confo
//   elements[]
//        ↓
// Project Tree
//
// =====================================================


export default function ConfoToProject(confo) {


    if(!confo){

        return null;

    }


    if(!Array.isArray(confo.elements)){

        console.warn(
            "[ConfoToProject] No elements found",
            confo
        );

        return null;

    }



    const children =
        confo.elements.map(
            element => ({

                id: element.id,

                type: element.type,

                props: element.props || {},

                children: []

            })
        );



    const projectTree = {

        type:"App",

        props:{},

        children:[

            {

                id:"main-container",

                type:"Container",

                props:{

                    layout:"flex",

                    direction:"column"

                },

                children

            }

        ]

    };



    return {

        version:"1.0.0",

        name:confo.name,

        tree:projectTree,

        metadata:{

            sourceConfo:confo.id,

            createdAt:new Date().toISOString()

        }

    };

}