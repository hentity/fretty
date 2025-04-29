
import { useAuth } from '../context/UserContext';
import { Navigate } from 'react-router-dom';
import Terminal from '../components/Terminal';
import { use, useEffect, useState } from 'react';

const Profile = () => {

    interface ContentType {
        type: string;
        content: string
    }

    const { user } = useAuth();
    const [content, setContent] = useState<ContentType[]>([{type:'query', content: 'What would you like to know about your profile?'}]);


    // Manages state of conversation with the terminal
    useEffect(() => {
        // Add command line terminal commands here
        if (content[content.length - 1].type === 'input'){
            if (content[content.length - 1].content === 'clr'){
                setContent([{type:'query', content: 'What would you like to know about your profile?'}]);
            } else if (content[content.length - 1].content === 'help'){
                setContent((prev) => [...prev, {type:'query', content: 'Available commands: clr, help'}]);
            } else if (content[content.length - 1].content === 'exit'){ 
                setContent((prev) => [...prev, {type:'query', content: 'You cannot escape this terminal!'}]);
            } else{
                setContent((prev) => [...prev, {type:'query', content: 'I didnt quite understand that. Type "help" for a list of commands.'}]);
            }
        }
        
    },[content])

    if (!user) {
        return <Navigate to="/auth" />; // Redirect to auth page if not logged in
    }

    // Function to send input to terminal to render 
    const handleEnter = (input: string) => {
        // Process the input and update the response state
        setContent((prev) => [...prev, {type:'input', content: input}]);
    };

    return (
        <div className="p-6">          
            {/* Terminal Componeent below  */}
            <Terminal 
                onEnter={handleEnter}
                height="h-120">
                <div className="">
                    {content.map((line, index) => (
                        line.type === "query" 
                            ? <div key={index} className="mb-2">{line.content}</div>
                            : <div key={index} className="text-green-700 mb-2">{line.content}</div>
                    ))}
                </div>
            </Terminal>
        </div>
    )
}

export default Profile