import React from "react";
import * as UI from "../../ui";


export default function ConfoNodeRenderer({
    node
}){

    if(!node){
        return null;
    }


    const Component = UI[node.type];


    console.log(
        "[ConfoNodeRenderer]",
        node.type,
        Component
    );


    if(!Component){

        console.error(
            "[ConfoNodeRenderer] Missing component:",
            node.type
        );

        return null;
    }


    return (

        <Component
            {...node.props}
        >

            {
                node.children?.map(
                    (child,index)=>(

                        <ConfoNodeRenderer
                            key={index}
                            node={child}
                        />

                    )
                )
            }

        </Component>

    );

}